import { abrirRepositorio, crearServidor } from './servidor.js';
import { normalizar } from './asistente.js';

const repo = abrirRepositorio();
const servidor = crearServidor();

async function consultar<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await servidor.executeOperation({ query, variables }, { contextValue: { repo } });
  if (res.body.kind !== 'single') throw new Error('Respuesta incremental inesperada');
  expect(res.body.singleResult.errors).toBeUndefined();
  return res.body.singleResult.data as T;
}

describe('API GraphQL', () => {
  it('devuelve los KPIs del período con su variación', async () => {
    const data = await consultar<{ resumen: { kpis: { clave: string; valor: number; variacion: number | null }[]; serie: unknown[] } }>(
      `query { resumen(filtros: { periodo: ULTIMOS_12_MESES }) { kpis { clave valor variacion } serie { mes } } }`,
    );
    const ingresos = data.resumen.kpis.find((k) => k.clave === 'ingresos')!;
    expect(ingresos.valor).toBeGreaterThan(8_000_000);
    expect(ingresos.variacion).not.toBeNull();
    expect(data.resumen.serie).toHaveLength(12);
  });

  it('no compara cuando el período es todo el histórico', async () => {
    const data = await consultar<{ resumen: { periodo: { comparaCon: string | null }; kpis: { variacion: number | null }[] } }>(
      `query { resumen(filtros: { periodo: TODO }) { periodo { comparaCon } kpis { variacion } } }`,
    );
    expect(data.resumen.periodo.comparaCon).toBeNull();
    expect(data.resumen.kpis.every((k) => k.variacion === null)).toBe(true);
  });

  it('los segmentos suman todos los clientes y el 100 % de los ingresos', async () => {
    const data = await consultar<{ segmentos: { clientes: number; participacionIngresos: number }[] }>(
      `query { segmentos { clientes participacionIngresos } }`,
    );
    expect(data.segmentos).toHaveLength(8);
    expect(data.segmentos.reduce((s, x) => s + x.clientes, 0)).toBe(5824);
    expect(data.segmentos.reduce((s, x) => s + x.participacionIngresos, 0)).toBeCloseTo(1, 2);
  });

  it('pagina y filtra clientes por segmento', async () => {
    const data = await consultar<{ clientes: { total: number; items: { segmento: string; monetario: number }[] } }>(
      `query($s: String) { clientes(segmento: $s, porPagina: 5) { total items { segmento monetario } } }`,
      { s: 'Campeones' },
    );
    expect(data.clientes.items).toHaveLength(5);
    expect(data.clientes.items.every((c) => c.segmento === 'Campeones')).toBe(true);
    const montos = data.clientes.items.map((c) => c.monetario);
    expect(montos).toEqual([...montos].sort((a, b) => b - a));
  });

  it('limita el tamaño de página a 50', async () => {
    const data = await consultar<{ clientes: { porPagina: number } }>(`query { clientes(porPagina: 1000) { porPagina } }`);
    expect(data.clientes.porPagina).toBe(50);
  });

  it('calcula la retención de cada cohorte empezando en 100 %', async () => {
    const data = await consultar<{ cohortes: { retencion: number[] }[] }>(`query { cohortes(limite: 3) { retencion } }`);
    expect(data.cohortes).toHaveLength(3);
    data.cohortes.forEach((c) => expect(c.retencion[0]).toBe(100));
  });

  it('confirma la regla de Pareto en el dataset', async () => {
    const data = await consultar<{ pareto: { top20: number; curva: unknown[] } }>(`query { pareto { top20 curva { clientes } } }`);
    expect(data.pareto.top20).toBeGreaterThan(70);
    expect(data.pareto.curva).toHaveLength(100);
  });
});

describe('Asistente de datos', () => {
  const preguntar = (pregunta: string) =>
    consultar<{ preguntar: { texto: string; consulta: string; tabla: { filas: string[][] } | null; sugerencias: string[] } }>(
      `query($p: String!) { preguntar(pregunta: $p, filtros: { region: TODAS }) { texto consulta tabla { filas } sugerencias } }`,
      { p: pregunta },
    ).then((d) => d.preguntar);

  it('responde ingresos con la misma consulta que el dashboard', async () => {
    const r = await preguntar('¿Cuánto facturamos?');
    expect(r.texto).toMatch(/se facturaron/);
    expect(r.consulta).toContain('resumen');
  });

  it('recomienda qué segmento reactivar con una tabla', async () => {
    const r = await preguntar('¿Qué segmento conviene reactivar?');
    expect(r.texto).toMatch(/Acción sugerida/);
    expect(r.tabla?.filas).toHaveLength(8);
  });

  it('sin segmento nombrado recomienda el de más ingresos para reactivar', async () => {
    const r = await preguntar('¿Qué segmento conviene reactivar?');
    expect(r.texto.startsWith('Conviene empezar por')).toBe(true);
  });

  it('reconoce un segmento puntual', async () => {
    const r = await preguntar('contame de los clientes en riesgo');
    expect(r.texto.startsWith('En riesgo')).toBe(true);
  });

  it('admite que no sabe y ofrece sugerencias', async () => {
    const r = await preguntar('¿Va a llover mañana?');
    expect(r.consulta).toBe('sin consulta');
    expect(r.sugerencias.length).toBeGreaterThan(0);
  });

  it('normaliza tildes y mayúsculas', () => {
    expect(normalizar('Retención ÁRBOL')).toBe('retencion arbol');
  });
});
