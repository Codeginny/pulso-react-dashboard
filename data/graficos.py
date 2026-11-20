"""
Gráficos del análisis exploratorio (para el informe y el caso de estudio).

Uso:
    python data/graficos.py

Genera PNG en docs/04-datos/graficos/ a partir de data/pulso.db.
"""

import sqlite3
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import pandas as pd  # noqa: E402

RAIZ = Path(__file__).resolve().parent
SALIDA = RAIZ.parent / "docs" / "04-datos" / "graficos"

VERDE, AMBAR, GRIS, TEXTO = "#0f766e", "#d97706", "#d9e2e2", "#12201f"
MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "font.size": 11,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.edgecolor": GRIS,
    "axes.labelcolor": TEXTO,
    "xtick.color": TEXTO,
    "ytick.color": TEXTO,
    "axes.titleweight": "bold",
    "axes.titlesize": 14,
    "axes.titlelocation": "left",
    "figure.dpi": 150,
})


def libras(v: float, _=None) -> str:
    return f"£ {v / 1e6:.1f} M".replace(".", ",") if v >= 1e6 else f"£ {v / 1e3:.0f} k"


def mes(m: str) -> str:
    return f"{MESES[int(m[5:]) - 1]} {m[2:4]}"


def guardar(fig, nombre: str) -> None:
    fig.tight_layout()
    fig.savefig(SALIDA / nombre, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(f"  {nombre}")


def main() -> None:
    SALIDA.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(RAIZ / "pulso.db")

    # 1. Estacionalidad: ingresos mensuales con la temporada alta marcada.
    serie = pd.read_sql("SELECT mes, ingresos FROM serie_mensual WHERE region='TODAS' ORDER BY mes", con)
    fig, ax = plt.subplots(figsize=(10, 4))
    colores = [AMBAR if m[5:] in ("09", "10", "11") else VERDE for m in serie["mes"]]
    ax.bar([mes(m) for m in serie["mes"]], serie["ingresos"], color=colores)
    ax.yaxis.set_major_formatter(libras)
    ax.tick_params(axis="x", rotation=60)
    ax.set_title("Ingresos por mes: septiembre a noviembre concentran la temporada alta")
    guardar(fig, "01-estacionalidad.png")

    # 2. Pareto: curva de concentración.
    pareto = pd.read_sql("SELECT pct_clientes, pct_ingresos FROM pareto WHERE region='TODAS'", con)
    fig, ax = plt.subplots(figsize=(7, 4.5))
    ax.plot(pareto["pct_clientes"], pareto["pct_ingresos"], color=VERDE, linewidth=2.5)
    ax.plot([0, 100], [0, 100], color=GRIS, linestyle="--", linewidth=1)
    top20 = pareto.loc[pareto["pct_clientes"] == 20, "pct_ingresos"].item()
    ax.axvline(20, color=AMBAR, linestyle=":")
    ax.axhline(top20, color=AMBAR, linestyle=":")
    ax.annotate(f"20 % de los clientes\n= {top20:.0f} % de los ingresos".replace(".", ","), (20, top20), (32, 55),
                arrowprops={"arrowstyle": "->", "color": TEXTO}, fontsize=11)
    ax.set_xlabel("% de clientes (de mayor a menor gasto)")
    ax.set_ylabel("% acumulado de ingresos")
    ax.set_title("Concentración de ingresos (curva de Pareto)")
    guardar(fig, "02-pareto.png")

    # 3. Segmentos: clientes vs ingresos.
    seg = pd.read_sql("SELECT segmento, clientes, ingresos FROM v_segmentos WHERE region='TODAS' ORDER BY orden", con)
    seg["pct_clientes"] = seg["clientes"] / seg["clientes"].sum() * 100
    seg["pct_ingresos"] = seg["ingresos"] / seg["ingresos"].sum() * 100
    fig, ax = plt.subplots(figsize=(9, 4.5))
    y = range(len(seg))
    ax.barh([i + 0.2 for i in y], seg["pct_clientes"], height=0.4, color=GRIS, label="% de clientes")
    ax.barh([i - 0.2 for i in y], seg["pct_ingresos"], height=0.4, color=VERDE, label="% de ingresos")
    ax.set_yticks(list(y), seg["segmento"])
    ax.invert_yaxis()
    ax.legend(frameon=False, loc="lower right")
    ax.set_title("Segmentos RFM: quién genera el valor")
    guardar(fig, "03-segmentos.png")

    # 4. Cohortes: mapa de calor de retención.
    coh = pd.read_sql("SELECT cohorte, indice, clientes FROM cohortes WHERE region='TODAS' AND cohorte >= '2010-12'", con)
    tabla = coh.pivot(index="cohorte", columns="indice", values="clientes")
    retencion = tabla.div(tabla[0], axis=0) * 100
    fig, ax = plt.subplots(figsize=(10, 5))
    datos = retencion.iloc[:, 1:].to_numpy()
    im = ax.imshow(datos, cmap="GnBu", aspect="auto", vmin=0, vmax=40)
    for i in range(datos.shape[0]):
        for j in range(datos.shape[1]):
            if pd.notna(datos[i, j]):
                ax.text(j, i, f"{datos[i, j]:.0f}", ha="center", va="center", fontsize=8, color="white" if datos[i, j] > 25 else TEXTO)
    ax.set_xticks(range(datos.shape[1]), [f"M{j}" for j in range(1, datos.shape[1] + 1)])
    ax.set_yticks(range(len(retencion)), [mes(c) for c in retencion.index])
    fig.colorbar(im, ax=ax, label="% que volvió a comprar")
    ax.set_title("Retención por cohorte de primera compra (mes 1 en adelante)")
    guardar(fig, "04-cohortes.png")

    # 5. Ticket promedio por región.
    kpis = pd.read_sql("SELECT region, ticket_promedio FROM kpis_ventana WHERE ventana='2010-12..2011-11' AND region<>'TODAS'", con)
    fig, ax = plt.subplots(figsize=(6, 3.2))
    nombres = {"REINO_UNIDO": "Reino Unido", "INTERNACIONAL": "Internacional"}
    ax.bar([nombres[r] for r in kpis["region"]], kpis["ticket_promedio"], color=[VERDE, AMBAR])
    for i, v in enumerate(kpis["ticket_promedio"]):
        ax.text(i, v + 15, f"£ {v:.0f}", ha="center", fontweight="bold")
    ax.set_title("Ticket promedio por pedido (últimos 12 meses)")
    ax.set_yticks([])
    ax.spines["left"].set_visible(False)
    guardar(fig, "05-ticket-region.png")


if __name__ == "__main__":
    main()
