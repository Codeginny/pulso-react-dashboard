import { etiquetaMes, type Filtros, type Repositorio } from './repositorio.js';

export interface RespuestaAsistente {
  texto: string;
  consulta: string;
  tabla: { columnas: string[]; filas: string[][] } | null;
  sugerencias: string[];
}

const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'GBP', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 });
const entero = new Intl.NumberFormat('es-AR');
const pct = (v: number) => `${(v * 100).toLocaleString('es-AR', { maximumFractionDigits: 1 })} %`;
const variacion = (v: number | null) =>
  v === null ? '' : ` (${v >= 0 ? '+' : ''}${(v * 100).toLocaleString('es-AR', { maximumFractionDigits: 1 })} % contra el período anterior)`;

/** Minúsculas y sin tildes, para comparar palabras clave. */
export function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const SUGERENCIAS = [
  '¿Cuánto facturamos?',
  '¿Qué segmento conviene reactivar?',
  '¿Cuáles son los productos más vendidos?',
  '¿Qué tan concentrados están los ingresos?',
  '¿Cuántos clientes vuelven a comprar?',
  '¿Cuál fue el mejor mes?',
];

const REGION_TEXTO = { TODAS: 'en todas las regiones', REINO_UNIDO: 'en el Reino Unido', INTERNACIONAL: 'fuera del Reino Unido' } as const;

// Raíces que identifican cada segmento dentro de una pregunta ya normalizada.
const ALIAS_SEGMENTO: Record<string, string[]> = {
  Campeones: ['campeon'],
  Leales: ['leal'],
  Potenciales: ['potencial'],
  Nuevos: ['segmento nuevo', 'segmento de nuevos', 'los nuevos'],
  'No se pueden perder': ['no se pueden perder', 'no podemos perder'],
  'En riesgo': ['en riesgo'],
  Hibernando: ['hibern'],
  Perdidos: ['perdidos'],
};

interface Intencion {
  id: string;
  palabras: string[];
  responder: (repo: Repositorio, filtros: Filtros, pregunta: string) => Omit<RespuestaAsistente, 'sugerencias'>;
}

/**
 * El asistente no genera texto libre: reconoce la intención de la pregunta
 * por palabras clave y responde con una consulta fija a la misma capa de datos
 * del dashboard. Así cada respuesta es reproducible y se puede auditar.
 */
const INTENCIONES: Intencion[] = [
  {
    id: 'segmento',
    palabras: ['segmento', 'reactivar', 'riesgo', 'campeon', 'leal', 'perdido', 'hibernando', 'rfm'],
    responder: (repo, f, pregunta) => {
      const segmentos = repo.segmentos(f.region);
      const q = normalizar(pregunta);
      const mencionado = segmentos.find((s) => ALIAS_SEGMENTO[s.nombre]?.some((alias) => q.includes(alias)));
      const foco =
        mencionado ?? segmentos.filter((s) => ['No se pueden perder', 'En riesgo'].includes(s.nombre)).sort((a, b) => b.ingresos - a.ingresos)[0]!;
      return {
        texto: mencionado
          ? `${foco.nombre}: ${entero.format(foco.clientes)} clientes que suman ${moneda.format(foco.ingresos)} (${pct(foco.participacionIngresos)} de los ingresos). ${foco.descripcion} Acción sugerida: ${foco.accion}`
          : `Conviene empezar por «${foco.nombre}»: ${entero.format(foco.clientes)} clientes que generaron ${moneda.format(foco.ingresos)} y hace en promedio ${Math.round(foco.recenciaPromedio)} días que no compran. Acción sugerida: ${foco.accion}`,
        consulta: `segmentos(region: ${f.region})`,
        tabla: {
          columnas: ['Segmento', 'Clientes', 'Ingresos', 'Días sin comprar'],
          filas: segmentos.map((s) => [s.nombre, entero.format(s.clientes), moneda.format(s.ingresos), String(Math.round(s.recenciaPromedio))]),
        },
      };
    },
  },
  {
    id: 'mejor-mes',
    palabras: ['mejor mes', 'pico', 'peor mes', 'estacional', 'temporada'],
    responder: (repo, f) => {
      const serie = repo.serie(f);
      const ordenada = [...serie].sort((a, b) => b.ingresos - a.ingresos);
      const mejor = ordenada[0]!;
      const peor = ordenada[ordenada.length - 1]!;
      return {
        texto: `El mejor mes fue ${etiquetaMes(mejor.mes)} con ${moneda.format(mejor.ingresos)} y el más flojo, ${etiquetaMes(peor.mes)} con ${moneda.format(peor.ingresos)}. Los picos se repiten entre septiembre y noviembre, cuando los comercios compran para las fiestas.`,
        consulta: `resumen(filtros: { periodo: ${f.periodo}, region: ${f.region} }).serie`,
        tabla: {
          columnas: ['Mes', 'Ingresos', 'Pedidos'],
          filas: ordenada.slice(0, 3).map((m) => [etiquetaMes(m.mes), moneda.format(m.ingresos), entero.format(m.pedidos)]),
        },
      };
    },
  },
  {
    id: 'producto',
    palabras: ['producto', 'vendido', 'articulo', 'item'],
    responder: (repo, f) => {
      const productos = repo.productos(f, 5);
      return {
        texto: `El producto que más ingresos dejó ${REGION_TEXTO[f.region]} es «${productos[0]!.descripcion}», con ${moneda.format(productos[0]!.ingresos)}. Estos son los cinco primeros:`,
        consulta: `productos(filtros: { periodo: ${f.periodo}, region: ${f.region} }, limite: 5)`,
        tabla: {
          columnas: ['Producto', 'Ingresos', 'Unidades', 'Clientes'],
          filas: productos.map((p) => [p.descripcion, moneda.format(p.ingresos), entero.format(p.unidades), entero.format(p.clientes)]),
        },
      };
    },
  },
  {
    id: 'pais',
    palabras: ['pais', 'paises', 'internacional', 'exterior', 'region'],
    responder: (repo, f) => {
      const paises = repo.paises({ ...f, region: f.region === 'REINO_UNIDO' ? 'TODAS' : f.region }, 5);
      return {
        texto: `${paises[0]!.nombre} concentra la mayor parte de las ventas. Después vienen ${paises
          .slice(1, 4)
          .map((p) => p.nombre)
          .join(', ')}.`,
        consulta: `paises(filtros: { periodo: ${f.periodo}, region: ${f.region} }, limite: 5)`,
        tabla: {
          columnas: ['País', 'Ingresos', 'Clientes'],
          filas: paises.map((p) => [p.nombre, moneda.format(p.ingresos), entero.format(p.clientes)]),
        },
      };
    },
  },
  {
    id: 'pareto',
    palabras: ['pareto', '80/20', 'concentr', 'dependemos', 'top 20'],
    responder: (repo, f) => {
      const { top20 } = repo.pareto(f.region);
      return {
        texto: `El 20 % de los clientes que más compran genera el ${top20.toLocaleString('es-AR')} % de los ingresos. Perder a pocos de ellos impacta fuerte, por eso el segmento «Campeones» necesita seguimiento propio.`,
        consulta: `pareto(region: ${f.region})`,
        tabla: null,
      };
    },
  },
  {
    id: 'retencion',
    palabras: ['retencion', 'vuelven', 'volvio', 'recompra', 'cohorte', 'fidel'],
    responder: (repo, f) => {
      const cohortes = repo.cohortes(f.region, '2010-12', 12);
      const promedio = (i: number) => {
        const con = cohortes.filter((c) => c.retencion.length > i);
        return con.reduce((s, c) => s + c.retencion[i]!, 0) / con.length;
      };
      const kpi = repo.kpis(f).find((k) => k.clave === 'tasa_recompra')!;
      return {
        texto: `En promedio, el ${promedio(1).toFixed(1).replace('.', ',')} % de los clientes nuevos vuelve a comprar al mes siguiente y el ${promedio(3).toFixed(1).replace('.', ',')} % sigue activo al tercer mes. En el período, el ${pct(kpi.valor)} de los clientes hizo más de un pedido${variacion(kpi.variacion)}.`,
        consulta: `cohortes(region: ${f.region}, desde: "2010-12") + resumen.kpis.tasa_recompra`,
        tabla: null,
      };
    },
  },
  {
    id: 'nuevos',
    palabras: ['nuevo', 'nuevos', 'adquisicion', 'captamos'],
    responder: (repo, f) => {
      const kpi = repo.kpis(f).find((k) => k.clave === 'clientes_nuevos')!;
      return {
        texto: `Se sumaron ${entero.format(kpi.valor)} clientes nuevos ${REGION_TEXTO[f.region]}${variacion(kpi.variacion)}.`,
        consulta: `resumen(filtros: { periodo: ${f.periodo}, region: ${f.region} }).kpis.clientes_nuevos`,
        tabla: null,
      };
    },
  },
  {
    id: 'ticket',
    palabras: ['ticket', 'promedio por pedido', 'gasto medio'],
    responder: (repo, f) => {
      const kpi = repo.kpis(f).find((k) => k.clave === 'ticket_promedio')!;
      return {
        texto: `El ticket promedio es de ${moneda.format(kpi.valor)} por pedido${variacion(kpi.variacion)}.`,
        consulta: `resumen(filtros: { periodo: ${f.periodo}, region: ${f.region} }).kpis.ticket_promedio`,
        tabla: null,
      };
    },
  },
  {
    id: 'devoluciones',
    palabras: ['devolucion', 'devoluciones', 'cancel'],
    responder: (repo, f) => {
      const kpi = repo.kpis(f).find((k) => k.clave === 'tasa_devolucion')!;
      return {
        texto: `Hubo ${pct(kpi.valor)} de facturas de devolución por cada pedido${variacion(kpi.variacion)}. En este indicador, que baje es buena noticia.`,
        consulta: `resumen(filtros: { periodo: ${f.periodo}, region: ${f.region} }).kpis.tasa_devolucion`,
        tabla: null,
      };
    },
  },
  {
    id: 'ingresos',
    palabras: ['ingreso', 'factur', 'venta', 'vendimos', 'cuanto', 'ganamos'],
    responder: (repo, f) => {
      const info = repo.infoPeriodo(f.periodo);
      const kpis = repo.kpis(f);
      const ingresos = kpis.find((k) => k.clave === 'ingresos')!;
      const pedidos = kpis.find((k) => k.clave === 'pedidos')!;
      return {
        texto: `En ${info.etiqueta.toLowerCase()} se facturaron ${moneda.format(ingresos.valor)} ${REGION_TEXTO[f.region]}, en ${entero.format(pedidos.valor)} pedidos${variacion(ingresos.variacion)}.`,
        consulta: `resumen(filtros: { periodo: ${f.periodo}, region: ${f.region} }).kpis`,
        tabla: null,
      };
    },
  },
];

export function responder(repo: Repositorio, pregunta: string, filtros: Filtros): RespuestaAsistente {
  const q = normalizar(pregunta);
  const intencion = INTENCIONES.find((i) => i.palabras.some((p) => q.includes(p)));
  if (!intencion) {
    return {
      texto:
        'Todavía no sé responder esa pregunta. Puedo contarte sobre ingresos, clientes nuevos, segmentos, productos, países, retención, ticket promedio y devoluciones.',
      consulta: 'sin consulta',
      tabla: null,
      sugerencias: SUGERENCIAS.slice(0, 4),
    };
  }
  const respuesta = intencion.responder(repo, filtros, pregunta);
  const sugerencias = SUGERENCIAS.filter((s) => !INTENCIONES.find((i) => i.id === intencion.id)?.palabras.some((p) => normalizar(s).includes(p))).slice(0, 3);
  return { ...respuesta, sugerencias };
}
