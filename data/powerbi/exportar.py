"""
Exporta el modelo de Pulso a CSV para Power BI (modelo estrella).

Uso:
    python data/powerbi/exportar.py

Genera data/powerbi/csv/:
    dim_cliente.csv   un registro por cliente con su segmento RFM
    dim_fecha.csv     calendario mensual con año, trimestre y si es temporada alta
    hecho_mensual.csv ingresos, pedidos y clientes por mes y región
    hecho_cohorte.csv clientes activos por cohorte y mes desde la primera compra

Las medidas DAX están en medidas.dax y el modelo explicado en docs/04-datos/README.md.
"""

import sqlite3
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parent
DB = RAIZ.parent / "pulso.db"
SALIDA = RAIZ / "csv"


def main() -> None:
    SALIDA.mkdir(exist_ok=True)
    with sqlite3.connect(DB) as con:
        clientes = pd.read_sql(
            "SELECT id AS cliente_id, pais, region, segmento, recencia, frecuencia, monetario, r, f, m, primera_compra, ultima_compra FROM clientes",
            con,
        )
        mensual = pd.read_sql(
            "SELECT mes, region, ingresos, pedidos, clientes, clientes_nuevos, unidades FROM serie_mensual WHERE region <> 'TODAS'",
            con,
        )
        cohortes = pd.read_sql("SELECT cohorte, indice AS mes_desde_alta, clientes FROM cohortes WHERE region = 'TODAS'", con)

    fechas = pd.DataFrame({"mes": sorted(mensual["mes"].unique())})
    periodo = pd.PeriodIndex(fechas["mes"], freq="M")
    fechas["fecha"] = periodo.to_timestamp().strftime("%Y-%m-%d")
    fechas["anio"] = periodo.year
    fechas["trimestre"] = "T" + periodo.quarter.astype(str)
    fechas["mes_nombre"] = periodo.strftime("%b")
    fechas["temporada_alta"] = periodo.month.isin([9, 10, 11])

    mensual["fecha"] = pd.PeriodIndex(mensual["mes"], freq="M").to_timestamp().strftime("%Y-%m-%d")

    clientes.to_csv(SALIDA / "dim_cliente.csv", index=False)
    fechas.to_csv(SALIDA / "dim_fecha.csv", index=False)
    mensual.to_csv(SALIDA / "hecho_mensual.csv", index=False)
    cohortes.to_csv(SALIDA / "hecho_cohorte.csv", index=False)
    for archivo in sorted(SALIDA.glob("*.csv")):
        print(f"  {archivo.name}: {sum(1 for _ in archivo.open()) - 1:,} filas")


if __name__ == "__main__":
    main()
