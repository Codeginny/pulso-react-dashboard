"""
Pipeline de datos de Pulso.

Lee el dataset público Online Retail II (UCI), lo limpia, calcula los
agregados que consume la API y los guarda en SQLite (data/pulso.db).

Uso:
    python data/pipeline.py [ruta/al/online_retail_II.csv]

Las decisiones de limpieza y modelado están explicadas en
docs/04-datos/README.md.
"""

from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

import numpy as np
import pandas as pd

RAIZ = Path(__file__).resolve().parent
CSV_POR_DEFECTO = RAIZ / "raw" / "online_retail_II.csv"
DB = RAIZ / "pulso.db"

# El dataset va del 01/12/2009 al 09/12/2011. Diciembre de 2011 está
# incompleto, así que el análisis usa 24 meses cerrados.
PRIMER_MES = "2009-12"
ULTIMO_MES = "2011-11"
FECHA_CORTE = pd.Timestamp("2011-12-01")

# Ventanas de tiempo que ofrece el filtro de período (actual y anterior).
VENTANAS = {
    "ULTIMOS_3_MESES": (("2011-09", "2011-11"), ("2011-06", "2011-08")),
    "ULTIMOS_6_MESES": (("2011-06", "2011-11"), ("2010-12", "2011-05")),
    "ULTIMOS_12_MESES": (("2010-12", "2011-11"), ("2009-12", "2010-11")),
    "TODO": ((PRIMER_MES, ULTIMO_MES), None),
}

REGIONES = ("TODAS", "REINO_UNIDO", "INTERNACIONAL")

PAISES_ES = {
    "United Kingdom": "Reino Unido", "Germany": "Alemania", "France": "Francia",
    "EIRE": "Irlanda", "Netherlands": "Países Bajos", "Spain": "España",
    "Belgium": "Bélgica", "Switzerland": "Suiza", "Portugal": "Portugal",
    "Australia": "Australia", "Norway": "Noruega", "Italy": "Italia",
    "Channel Islands": "Islas del Canal", "Finland": "Finlandia",
    "Cyprus": "Chipre", "Sweden": "Suecia", "Denmark": "Dinamarca",
    "Austria": "Austria", "Japan": "Japón", "Poland": "Polonia",
    "Greece": "Grecia", "USA": "Estados Unidos", "Israel": "Israel",
    "Unspecified": "Sin especificar", "Singapore": "Singapur",
    "Iceland": "Islandia", "Canada": "Canadá", "Malta": "Malta",
    "United Arab Emirates": "Emiratos Árabes Unidos", "Lithuania": "Lituania",
    "Czech Republic": "República Checa", "Brazil": "Brasil", "Bahrain": "Baréin",
    "Thailand": "Tailandia", "Lebanon": "Líbano", "Korea": "Corea del Sur",
    "European Community": "Comunidad Europea", "RSA": "Sudáfrica",
    "West Indies": "Antillas", "Saudi Arabia": "Arabia Saudita",
    "Nigeria": "Nigeria", "Bermuda": "Bermudas", "Hong Kong": "Hong Kong",
}


def cargar(csv: Path) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Devuelve (ventas limpias, devoluciones) a partir del CSV crudo."""
    df = pd.read_csv(csv, dtype={"Invoice": str, "StockCode": str, "Customer ID": "float64"})
    df = df.rename(columns={
        "Invoice": "factura", "StockCode": "codigo", "Description": "descripcion",
        "Quantity": "cantidad", "InvoiceDate": "fecha", "Price": "precio",
        "Customer ID": "cliente", "Country": "pais",
    })
    df["fecha"] = pd.to_datetime(df["fecha"])
    df["mes"] = df["fecha"].dt.strftime("%Y-%m")
    df = df[(df["mes"] >= PRIMER_MES) & (df["mes"] <= ULTIMO_MES)]

    filas_crudas = len(df)
    df = df.dropna(subset=["cliente"]).drop_duplicates()
    df["cliente"] = df["cliente"].astype(int)
    df["pais"] = df["pais"].map(PAISES_ES).fillna(df["pais"])
    df["region"] = np.where(df["pais"] == "Reino Unido", "REINO_UNIDO", "INTERNACIONAL")

    devoluciones = df[df["factura"].str.startswith("C")]
    # Códigos que no son productos: envío, ajustes, comisiones, muestras.
    no_productos = {"POST", "DOT", "M", "BANK CHARGES", "AMAZONFEE", "CRUK", "D", "S", "ADJUST", "ADJUST2", "TEST001", "TEST002", "C2", "PADS", "B"}
    ventas = df[
        ~df["factura"].str.startswith("C")
        & (df["cantidad"] > 0)
        & (df["precio"] > 0)
        & ~df["codigo"].isin(no_productos)
    ].copy()
    ventas["importe"] = (ventas["cantidad"] * ventas["precio"]).round(2)
    ventas["descripcion"] = ventas["descripcion"].fillna("").str.strip().str.capitalize()

    print(f"Filas en 24 meses: {filas_crudas:,} · ventas limpias: {len(ventas):,} · líneas de devolución: {len(devoluciones):,}")
    return ventas, devoluciones


def filtrar_region(df: pd.DataFrame, region: str) -> pd.DataFrame:
    return df if region == "TODAS" else df[df["region"] == region]


def en_ventana(df: pd.DataFrame, ventana: tuple[str, str]) -> pd.DataFrame:
    desde, hasta = ventana
    return df[(df["mes"] >= desde) & (df["mes"] <= hasta)]


def serie_mensual(ventas: pd.DataFrame, primera_compra: pd.Series) -> pd.DataFrame:
    filas = []
    for region in REGIONES:
        v = filtrar_region(ventas, region)
        g = v.groupby("mes").agg(
            ingresos=("importe", "sum"),
            pedidos=("factura", "nunique"),
            clientes=("cliente", "nunique"),
            unidades=("cantidad", "sum"),
        )
        nuevos = primera_compra[primera_compra.index.isin(v["cliente"].unique())]
        g["clientes_nuevos"] = nuevos.value_counts().reindex(g.index, fill_value=0)
        g = g.reset_index()
        g["region"] = region
        filas.append(g)
    return pd.concat(filas, ignore_index=True)


def kpis_ventana(ventas: pd.DataFrame, devoluciones: pd.DataFrame, primera_compra: pd.Series) -> pd.DataFrame:
    filas = []
    ventanas = {v for actual, anterior in VENTANAS.values() for v in (actual, anterior) if v}
    for ventana in ventanas:
        for region in REGIONES:
            v = en_ventana(filtrar_region(ventas, region), ventana)
            d = en_ventana(filtrar_region(devoluciones, region), ventana)
            clientes = v["cliente"].unique()
            pedidos_por_cliente = v.groupby("cliente")["factura"].nunique()
            meses_primera = primera_compra.reindex(clientes)
            nuevos = int(meses_primera.between(ventana[0], ventana[1]).sum())
            ingresos = float(v["importe"].sum())
            pedidos = int(v["factura"].nunique())
            filas.append({
                "ventana": f"{ventana[0]}..{ventana[1]}",
                "region": region,
                "ingresos": round(ingresos, 2),
                "pedidos": pedidos,
                "clientes": len(clientes),
                "clientes_nuevos": nuevos,
                "ticket_promedio": round(ingresos / pedidos, 2) if pedidos else 0,
                "tasa_recompra": round(float((pedidos_por_cliente > 1).mean()), 4) if len(clientes) else 0,
                "tasa_devolucion": round(d["factura"].nunique() / pedidos, 4) if pedidos else 0,
            })
    return pd.DataFrame(filas)


def ranking_ventana(ventas: pd.DataFrame, columnas: list[str], limite: int | None) -> pd.DataFrame:
    filas = []
    for actual, _ in VENTANAS.values():
        for region in REGIONES:
            v = en_ventana(filtrar_region(ventas, region), actual)
            g = v.groupby(columnas).agg(
                ingresos=("importe", "sum"),
                unidades=("cantidad", "sum"),
                clientes=("cliente", "nunique"),
                pedidos=("factura", "nunique"),
            ).reset_index().sort_values("ingresos", ascending=False)
            if limite:
                g = g.head(limite)
            g["ventana"] = f"{actual[0]}..{actual[1]}"
            g["region"] = region
            filas.append(g)
    df = pd.concat(filas, ignore_index=True)
    df["ingresos"] = df["ingresos"].round(2)
    return df


def segmento_rfm(r: int, f: int) -> str:
    if r >= 4 and f >= 4:
        return "Campeones"
    if r >= 3 and f >= 3:
        return "Leales"
    if r >= 4 and f <= 1:
        return "Nuevos"
    if r >= 3:
        return "Potenciales"
    if f >= 4:
        return "No se pueden perder"
    if r == 2:
        return "En riesgo"
    if f >= 2:
        return "Hibernando"
    return "Perdidos"


def modelo_rfm(ventas: pd.DataFrame) -> pd.DataFrame:
    c = ventas.groupby("cliente").agg(
        ultima_compra=("fecha", "max"),
        primera_compra=("fecha", "min"),
        frecuencia=("factura", "nunique"),
        monetario=("importe", "sum"),
        unidades=("cantidad", "sum"),
    )
    # País principal: donde más compró cada cliente.
    pais = ventas.groupby(["cliente", "pais"])["importe"].sum().reset_index()
    pais = pais.sort_values("importe").drop_duplicates("cliente", keep="last").set_index("cliente")["pais"]
    c["pais"] = pais
    c["region"] = np.where(c["pais"] == "Reino Unido", "REINO_UNIDO", "INTERNACIONAL")
    c["recencia"] = (FECHA_CORTE - c["ultima_compra"]).dt.days
    # Puntajes por cuartiles (1 = peor, 4 = mejor). El rank evita bordes repetidos.
    c["r"] = pd.qcut(c["recencia"].rank(method="first"), 4, labels=[4, 3, 2, 1]).astype(int)
    c["f"] = pd.qcut(c["frecuencia"].rank(method="first"), 4, labels=[1, 2, 3, 4]).astype(int)
    c["m"] = pd.qcut(c["monetario"].rank(method="first"), 4, labels=[1, 2, 3, 4]).astype(int)
    c["segmento"] = [segmento_rfm(r, f) for r, f in zip(c["r"], c["f"])]
    c["ticket_promedio"] = (c["monetario"] / c["frecuencia"]).round(2)
    c["monetario"] = c["monetario"].round(2)
    c["primera_compra"] = c["primera_compra"].dt.strftime("%Y-%m-%d")
    c["ultima_compra"] = c["ultima_compra"].dt.strftime("%Y-%m-%d")
    return c.reset_index().rename(columns={"cliente": "id"})


def cohortes(ventas: pd.DataFrame, primera_compra: pd.Series) -> pd.DataFrame:
    filas = []
    meses = pd.period_range(PRIMER_MES, ULTIMO_MES, freq="M")
    for region in REGIONES:
        v = filtrar_region(ventas, region)[["cliente", "mes"]].drop_duplicates()
        v["cohorte"] = v["cliente"].map(primera_compra)
        v["indice"] = [
            (pd.Period(m, "M") - pd.Period(c, "M")).n for m, c in zip(v["mes"], v["cohorte"])
        ]
        g = v.groupby(["cohorte", "indice"])["cliente"].nunique().reset_index(name="clientes")
        g = g[g["cohorte"].isin([str(m) for m in meses])]
        g["region"] = region
        filas.append(g)
    return pd.concat(filas, ignore_index=True)


def pareto(clientes: pd.DataFrame) -> pd.DataFrame:
    filas = []
    for region in REGIONES:
        c = clientes if region == "TODAS" else clientes[clientes["region"] == region]
        montos = np.sort(c["monetario"].to_numpy())[::-1]
        acumulado = np.cumsum(montos) / montos.sum()
        for pct in range(1, 101):
            idx = max(int(np.ceil(len(montos) * pct / 100)) - 1, 0)
            filas.append({"region": region, "pct_clientes": pct, "pct_ingresos": round(float(acumulado[idx]) * 100, 2)})
    return pd.DataFrame(filas)


def main() -> None:
    csv = Path(sys.argv[1]) if len(sys.argv) > 1 else CSV_POR_DEFECTO
    if not csv.exists():
        sys.exit(f"No encuentro {csv}. Descargá Online Retail II (ver data/README.md).")

    ventas, devoluciones = cargar(csv)
    primera_compra = ventas.groupby("cliente")["mes"].min()
    clientes = modelo_rfm(ventas)

    tablas = {
        "serie_mensual": serie_mensual(ventas, primera_compra),
        "kpis_ventana": kpis_ventana(ventas, devoluciones, primera_compra),
        "productos_ventana": ranking_ventana(ventas, ["codigo", "descripcion"], 30),
        "paises_ventana": ranking_ventana(ventas, ["pais"], None),
        "clientes": clientes,
        "cohortes": cohortes(ventas, primera_compra),
        "pareto": pareto(clientes),
    }
    # Los productos con más de una descripción aparecen repetidos: me quedo con la de más ventas.
    tablas["productos_ventana"] = tablas["productos_ventana"].drop_duplicates(["ventana", "region", "codigo"])

    DB.unlink(missing_ok=True)
    with sqlite3.connect(DB) as con:
        for nombre, df in tablas.items():
            df.to_sql(nombre, con, index=False)
            print(f"  {nombre}: {len(df):,} filas")
        con.executescript((RAIZ / "sql" / "esquema.sql").read_text(encoding="utf-8"))
    print(f"Listo: {DB.relative_to(RAIZ.parent)} ({DB.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
