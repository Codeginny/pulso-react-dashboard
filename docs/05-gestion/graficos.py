"""
Gráficos de gestión del proyecto (velocidad y burndown).

Uso:
    data/.venv/bin/python docs/05-gestion/graficos.py

Los puntos comprometidos y terminados salen de backlog-jira.csv; el avance
diario dentro de cada sprint es SIMULADO (ver README.md).
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

SALIDA = Path(__file__).resolve().parent / "graficos"
VERDE, AMBAR, GRIS, TEXTO = "#0f766e", "#d97706", "#d9e2e2", "#12201f"

plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "font.size": 11,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.edgecolor": GRIS,
    "axes.titleweight": "bold",
    "axes.titlesize": 14,
    "axes.titlelocation": "left",
    "figure.dpi": 150,
})

SPRINTS = ["Sprint 1", "Sprint 2", "Sprint 3", "Sprint 4"]
COMPROMETIDOS = [21, 26, 24, 16]
TERMINADOS = [21, 23, 24, 13]
# Puntos que quedaban al cierre de cada día (lunes a viernes), SIMULADO.
RESTANTES_SPRINT_2 = [26, 26, 21, 13, 8, 3]


def main() -> None:
    SALIDA.mkdir(exist_ok=True)

    fig, ax = plt.subplots(figsize=(8, 4))
    x = range(len(SPRINTS))
    ax.bar([i - 0.2 for i in x], COMPROMETIDOS, width=0.4, color=GRIS, label="Comprometidos")
    ax.bar([i + 0.2 for i in x], TERMINADOS, width=0.4, color=VERDE, label="Terminados")
    for i, (c, t) in enumerate(zip(COMPROMETIDOS, TERMINADOS)):
        ax.text(i + 0.2, t + 0.5, str(t), ha="center", fontweight="bold")
    promedio = sum(TERMINADOS) / len(TERMINADOS)
    ax.axhline(promedio, color=AMBAR, linestyle="--", linewidth=1.5)
    ax.text(3.45, promedio + 0.6, f"promedio {promedio:.1f}".replace(".", ","), color=AMBAR, ha="right")
    ax.set_xticks(list(x), SPRINTS)
    ax.set_ylabel("Story points")
    ax.legend(frameon=False, loc="upper left")
    ax.set_title("Velocidad por sprint")
    fig.tight_layout()
    fig.savefig(SALIDA / "01-velocidad.png", facecolor="white")
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(8, 4))
    dias = ["Inicio", "Lun", "Mar", "Mié", "Jue", "Vie"]
    ideal = [26 - 26 * i / 5 for i in range(6)]
    ax.plot(dias, ideal, color=GRIS, linestyle="--", label="Ideal")
    ax.plot(dias, RESTANTES_SPRINT_2, color=VERDE, marker="o", linewidth=2.5, label="Real")
    ax.annotate("Storybook pasa\nal sprint 3 (3 pts)", (5, 3), (3.4, 14), arrowprops={"arrowstyle": "->", "color": TEXTO})
    ax.annotate("SSR: hidratación\nmás compleja de lo estimado", (1, 26), (1.3, 30), arrowprops={"arrowstyle": "->", "color": TEXTO})
    ax.set_ylim(0, 34)
    ax.set_ylabel("Puntos restantes")
    ax.legend(frameon=False, loc="lower left")
    ax.set_title("Burndown del sprint 2 (design system + SSR)")
    fig.tight_layout()
    fig.savefig(SALIDA / "02-burndown-sprint-2.png", facecolor="white")
    plt.close(fig)
    print("Listo: docs/05-gestion/graficos/")


if __name__ == "__main__":
    main()
