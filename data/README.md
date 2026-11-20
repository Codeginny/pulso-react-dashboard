# Datos

`pulso.db` ya está en el repo; sólo hace falta esto si querés regenerarla.

1. Descargá *Online Retail II* del [UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/502/online+retail+ii)
   y exportá las dos hojas del Excel a un único `online_retail_II.csv` (o usá la versión CSV de Kaggle).
2. Guardalo en `data/raw/online_retail_II.csv` (la carpeta está en `.gitignore`).
3. Corré:

```bash
python3 -m venv data/.venv
data/.venv/bin/pip install pandas matplotlib
data/.venv/bin/python data/pipeline.py            # genera pulso.db
data/.venv/bin/python data/powerbi/exportar.py    # CSV para Power BI
data/.venv/bin/python data/graficos.py            # gráficos de docs/04-datos
```

Las decisiones de limpieza y modelado están en [docs/04-datos](../docs/04-datos/README.md).
