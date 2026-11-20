import type { Database } from 'better-sqlite3';

export type Periodo = 'ULTIMOS_3_MESES' | 'ULTIMOS_6_MESES' | 'ULTIMOS_12_MESES' | 'TODO';
export type Region = 'TODAS' | 'REINO_UNIDO' | 'INTERNACIONAL';
export type OrdenClientes = 'INGRESOS_DESC' | 'RECENCIA_ASC' | 'FRECUENCIA_DESC';

export interface Filtros {
  periodo: Periodo;
  region: Region;
}

export const FILTROS_POR_DEFECTO: Filtros = { periodo: 'ULTIMOS_12_MESES', region: 'TODAS' };

/** Primer mes del dataset: antes no hay historia para saber si un cliente es nuevo. */
const PRIMER_MES = '2009-12';

interface FilaPeriodo {
  periodo: Periodo;
  etiqueta: string;
  desde: string;
  hasta: string;
  anterior_desde: string | null;
  anterior_hasta: string | null;
}

interface FilaKpis {
  ingresos: number;
  pedidos: number;
  clientes: number;
  clientes_nuevos: number;
  ticket_promedio: number;
  tasa_recompra: number;
  tasa_devolucion: number;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "2011-03" → "mar 2011" */
export function etiquetaMes(mes: string): string {
  const [anio, m] = mes.split('-');
  return `${MESES[Number(m) - 1]} ${anio}`;
}

const ORDEN_SQL: Record<OrdenClientes, string> = {
  INGRESOS_DESC: 'monetario DESC',
  RECENCIA_ASC: 'recencia ASC, monetario DESC',
  FRECUENCIA_DESC: 'frecuencia DESC, monetario DESC',
};

/**
 * Todas las consultas a SQLite. Los resolvers y el asistente pasan por acá,
 * así que los números que muestra el dashboard y los que dice el asistente
 * salen siempre de la misma consulta.
 */
export function crearRepositorio(db: Database) {
  const periodo = (p: Periodo) => {
    const fila = db.prepare('SELECT * FROM periodos WHERE periodo = ?').get(p) as FilaPeriodo | undefined;
    if (!fila) throw new Error(`Período desconocido: ${p}`);
    return fila;
  };

  const ventana = (desde: string, hasta: string) => `${desde}..${hasta}`;

  const kpisDe = (v: string, region: Region) =>
    db.prepare('SELECT * FROM kpis_ventana WHERE ventana = ? AND region = ?').get(v, region) as FilaKpis | undefined;

  return {
    periodos() {
      const filas = db.prepare('SELECT * FROM periodos').all() as FilaPeriodo[];
      return filas.map((f) => infoPeriodo(f));
    },

    infoPeriodo(p: Periodo) {
      return infoPeriodo(periodo(p));
    },

    kpis({ periodo: p, region }: Filtros) {
      const info = periodo(p);
      const actual = kpisDe(ventana(info.desde, info.hasta), region);
      if (!actual) throw new Error('No hay datos para esos filtros');
      const anterior = info.anterior_desde ? kpisDe(ventana(info.anterior_desde, info.anterior_hasta!), region) : undefined;

      // El dataset arranca en dic 2009: en esa ventana todos los clientes cuentan como
      // nuevos, así que comparar clientes nuevos contra ella exageraría la caída.
      const sinHistoria = info.anterior_desde === PRIMER_MES;

      const kpi = (
        clave: keyof FilaKpis,
        etiqueta: string,
        formato: 'MONEDA' | 'ENTERO' | 'PORCENTAJE',
        mejorSiSube = true,
      ) => {
        const valor = actual[clave];
        const previo = clave === 'clientes_nuevos' && sinHistoria ? null : (anterior?.[clave] ?? null);
        return {
          clave,
          etiqueta,
          valor,
          anterior: previo,
          variacion: previo ? Number(((valor - previo) / previo).toFixed(4)) : null,
          formato,
          mejorSiSube,
        };
      };

      return [
        kpi('ingresos', 'Ingresos', 'MONEDA'),
        kpi('pedidos', 'Pedidos', 'ENTERO'),
        kpi('clientes', 'Clientes activos', 'ENTERO'),
        kpi('clientes_nuevos', 'Clientes nuevos', 'ENTERO'),
        kpi('ticket_promedio', 'Ticket promedio', 'MONEDA'),
        kpi('tasa_recompra', 'Tasa de recompra', 'PORCENTAJE'),
        kpi('tasa_devolucion', 'Devoluciones por pedido', 'PORCENTAJE', false),
      ];
    },

    serie({ periodo: p, region }: Filtros) {
      const info = periodo(p);
      return db
        .prepare(
          `SELECT mes, ROUND(ingresos, 2) AS ingresos, pedidos, clientes, clientes_nuevos AS clientesNuevos
           FROM serie_mensual WHERE region = ? AND mes BETWEEN ? AND ? ORDER BY mes`,
        )
        .all(region, info.desde, info.hasta) as {
        mes: string;
        ingresos: number;
        pedidos: number;
        clientes: number;
        clientesNuevos: number;
      }[];
    },

    segmentos(region: Region) {
      const filas = db
        .prepare(
          `SELECT segmento AS nombre, orden, descripcion, accion, clientes, ingresos,
                  recencia_promedio AS recenciaPromedio, frecuencia_promedio AS frecuenciaPromedio,
                  ticket_promedio AS ticketPromedio
           FROM v_segmentos WHERE region = ? ORDER BY orden`,
        )
        .all(region) as {
        nombre: string;
        orden: number;
        descripcion: string;
        accion: string;
        clientes: number;
        ingresos: number;
        recenciaPromedio: number;
        frecuenciaPromedio: number;
        ticketPromedio: number;
      }[];
      const total = filas.reduce((s, f) => s + f.ingresos, 0);
      return filas.map((f) => ({ ...f, participacionIngresos: Number((f.ingresos / total).toFixed(4)) }));
    },

    clientes(args: {
      region: Region;
      segmento?: string | null;
      busqueda?: string | null;
      orden: OrdenClientes;
      pagina: number;
      porPagina: number;
    }) {
      const porPagina = Math.min(Math.max(args.porPagina, 1), 50);
      const pagina = Math.max(args.pagina, 1);
      const condiciones: string[] = [];
      const params: (string | number)[] = [];
      if (args.region !== 'TODAS') {
        condiciones.push('region = ?');
        params.push(args.region);
      }
      if (args.segmento) {
        condiciones.push('segmento = ?');
        params.push(args.segmento);
      }
      if (args.busqueda?.trim()) {
        condiciones.push('(CAST(id AS TEXT) LIKE ? OR pais LIKE ?)');
        const patron = `%${args.busqueda.trim()}%`;
        params.push(patron, patron);
      }
      const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
      const { total } = db.prepare(`SELECT COUNT(*) AS total FROM clientes ${where}`).get(...params) as { total: number };
      const items = db
        .prepare(
          `SELECT id, pais, segmento, recencia, frecuencia, monetario, ticket_promedio AS ticketPromedio,
                  primera_compra AS primeraCompra, ultima_compra AS ultimaCompra,
                  (r || f || m) AS puntajeRfm
           FROM clientes ${where} ORDER BY ${ORDEN_SQL[args.orden]} LIMIT ? OFFSET ?`,
        )
        .all(...params, porPagina, (pagina - 1) * porPagina);
      return { items, total, pagina, porPagina };
    },

    cohortes(region: Region, desde: string, limite: number) {
      const filas = db
        .prepare(
          `SELECT cohorte, indice, clientes FROM cohortes
           WHERE region = ? AND cohorte >= ? ORDER BY cohorte, indice`,
        )
        .all(region, desde) as { cohorte: string; indice: number; clientes: number }[];
      const porCohorte = new Map<string, { indice: number; clientes: number }[]>();
      for (const f of filas) {
        if (!porCohorte.has(f.cohorte)) porCohorte.set(f.cohorte, []);
        porCohorte.get(f.cohorte)!.push(f);
      }
      return [...porCohorte.entries()].slice(0, limite).map(([mes, puntos]) => {
        const tamanio = puntos.find((p) => p.indice === 0)?.clientes ?? 0;
        const maximo = Math.max(...puntos.map((p) => p.indice));
        const retencion = Array.from({ length: maximo + 1 }, (_, i) => {
          const p = puntos.find((x) => x.indice === i);
          return tamanio ? Number((((p?.clientes ?? 0) / tamanio) * 100).toFixed(1)) : 0;
        });
        return { mes, clientes: tamanio, retencion };
      });
    },

    productos({ periodo: p, region }: Filtros, limite: number) {
      const info = periodo(p);
      return db
        .prepare(
          `SELECT codigo, descripcion, ingresos, unidades, clientes FROM productos_ventana
           WHERE ventana = ? AND region = ? ORDER BY ingresos DESC LIMIT ?`,
        )
        .all(ventana(info.desde, info.hasta), region, Math.min(limite, 30)) as {
        codigo: string;
        descripcion: string;
        ingresos: number;
        unidades: number;
        clientes: number;
      }[];
    },

    paises({ periodo: p, region }: Filtros, limite: number) {
      const info = periodo(p);
      return db
        .prepare(
          `SELECT pais AS nombre, ingresos, clientes, pedidos FROM paises_ventana
           WHERE ventana = ? AND region = ? ORDER BY ingresos DESC LIMIT ?`,
        )
        .all(ventana(info.desde, info.hasta), region, limite) as {
        nombre: string;
        ingresos: number;
        clientes: number;
        pedidos: number;
      }[];
    },

    pareto(region: Region) {
      const filas = db
        .prepare('SELECT pct_clientes AS clientes, pct_ingresos AS ingresos FROM pareto WHERE region = ? ORDER BY pct_clientes')
        .all(region) as { clientes: number; ingresos: number }[];
      return { top20: filas.find((f) => f.clientes === 20)?.ingresos ?? 0, curva: filas };
    },
  };

  function infoPeriodo(f: FilaPeriodo) {
    return {
      periodo: f.periodo,
      etiqueta: f.etiqueta,
      desde: f.desde,
      hasta: f.hasta,
      comparaCon: f.anterior_desde ? `${etiquetaMes(f.anterior_desde)} – ${etiquetaMes(f.anterior_hasta!)}` : null,
    };
  }
}

export type Repositorio = ReturnType<typeof crearRepositorio>;
