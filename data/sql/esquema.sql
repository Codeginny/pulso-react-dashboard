-- Índices, catálogos y vistas que usa la API.
-- Se ejecuta al final de data/pipeline.py, después de cargar las tablas.

CREATE INDEX idx_serie ON serie_mensual (region, mes);
CREATE INDEX idx_kpis ON kpis_ventana (ventana, region);
CREATE INDEX idx_productos ON productos_ventana (ventana, region);
CREATE INDEX idx_paises ON paises_ventana (ventana, region);
CREATE INDEX idx_clientes_region ON clientes (region, segmento);
CREATE INDEX idx_cohortes ON cohortes (region, cohorte);

-- Qué meses abarca cada opción del filtro de período y contra qué se compara.
CREATE TABLE periodos (
  periodo TEXT PRIMARY KEY,
  etiqueta TEXT NOT NULL,
  desde TEXT NOT NULL,
  hasta TEXT NOT NULL,
  anterior_desde TEXT,
  anterior_hasta TEXT
);
INSERT INTO periodos VALUES
  ('ULTIMOS_3_MESES', 'Últimos 3 meses', '2011-09', '2011-11', '2011-06', '2011-08'),
  ('ULTIMOS_6_MESES', 'Últimos 6 meses', '2011-06', '2011-11', '2010-12', '2011-05'),
  ('ULTIMOS_12_MESES', 'Últimos 12 meses', '2010-12', '2011-11', '2009-12', '2010-11'),
  ('TODO', 'Dic 2009 – Nov 2011', '2009-12', '2011-11', NULL, NULL);

-- Qué hacer con cada segmento RFM: lo lee el dashboard y el asistente.
CREATE TABLE acciones_segmento (
  segmento TEXT PRIMARY KEY,
  orden INTEGER NOT NULL,
  descripcion TEXT NOT NULL,
  accion TEXT NOT NULL
);
INSERT INTO acciones_segmento VALUES
  ('Campeones', 1, 'Compraron hace poco, compran seguido y gastan mucho.', 'Darles acceso anticipado a colecciones y pedirles referidos.'),
  ('Leales', 2, 'Compran con regularidad y responden bien a las campañas.', 'Programa de beneficios por volumen y venta cruzada.'),
  ('Potenciales', 3, 'Compraron hace poco pero todavía pocas veces.', 'Secuencia de bienvenida con productos complementarios.'),
  ('Nuevos', 4, 'Primera compra reciente.', 'Acompañar la segunda compra con un incentivo de tiempo limitado.'),
  ('No se pueden perder', 5, 'Compraban mucho y seguido, pero hace tiempo que no vuelven.', 'Contacto directo del equipo comercial esta semana.'),
  ('En riesgo', 6, 'Su recencia viene cayendo.', 'Campaña de reactivación con oferta personalizada.'),
  ('Hibernando', 7, 'Pocas compras y hace mucho.', 'Recordatorio estacional de bajo costo.'),
  ('Perdidos', 8, 'Una compra lejana y de bajo monto.', 'No invertir: sólo comunicaciones masivas.');

-- Resumen por segmento y región (la región TODAS se arma con UNION).
CREATE VIEW v_segmentos AS
WITH base AS (
  SELECT region, segmento, id, recencia, frecuencia, monetario FROM clientes
  UNION ALL
  SELECT 'TODAS', segmento, id, recencia, frecuencia, monetario FROM clientes
)
SELECT
  b.region,
  b.segmento,
  a.orden,
  a.descripcion,
  a.accion,
  COUNT(*) AS clientes,
  ROUND(SUM(b.monetario), 2) AS ingresos,
  ROUND(AVG(b.recencia), 1) AS recencia_promedio,
  ROUND(AVG(b.frecuencia), 1) AS frecuencia_promedio,
  ROUND(SUM(b.monetario) / SUM(b.frecuencia), 2) AS ticket_promedio
FROM base b
JOIN acciones_segmento a ON a.segmento = b.segmento
GROUP BY b.region, b.segmento;
