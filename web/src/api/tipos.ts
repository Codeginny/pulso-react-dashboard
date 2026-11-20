// Tipos que reflejan el esquema GraphQL de api/src/schema.ts.

export type Periodo = 'ULTIMOS_3_MESES' | 'ULTIMOS_6_MESES' | 'ULTIMOS_12_MESES' | 'TODO';
export type Region = 'TODAS' | 'REINO_UNIDO' | 'INTERNACIONAL';
export type OrdenClientes = 'INGRESOS_DESC' | 'RECENCIA_ASC' | 'FRECUENCIA_DESC';
export type FormatoKpi = 'MONEDA' | 'ENTERO' | 'PORCENTAJE';

export interface Filtros {
  periodo: Periodo;
  region: Region;
}

export interface PeriodoInfo {
  periodo: Periodo;
  etiqueta: string;
  desde: string;
  hasta: string;
  comparaCon: string | null;
}

export interface Kpi {
  clave: string;
  etiqueta: string;
  valor: number;
  anterior: number | null;
  variacion: number | null;
  formato: FormatoKpi;
  mejorSiSube: boolean;
}

export interface PuntoMensual {
  mes: string;
  ingresos: number;
  pedidos: number;
  clientes: number;
  clientesNuevos: number;
}

export interface Resumen {
  periodo: PeriodoInfo;
  kpis: Kpi[];
  serie: PuntoMensual[];
}

export interface Segmento {
  nombre: string;
  orden: number;
  descripcion: string;
  accion: string;
  clientes: number;
  ingresos: number;
  participacionIngresos: number;
  recenciaPromedio: number;
  frecuenciaPromedio: number;
  ticketPromedio: number;
}

export interface Cliente {
  id: string;
  pais: string;
  segmento: string;
  recencia: number;
  frecuencia: number;
  monetario: number;
  ticketPromedio: number;
  ultimaCompra: string;
  puntajeRfm: string;
}

export interface Cohorte {
  mes: string;
  clientes: number;
  retencion: number[];
}

export interface Producto {
  codigo: string;
  descripcion: string;
  ingresos: number;
  unidades: number;
  clientes: number;
}

export interface Pais {
  nombre: string;
  ingresos: number;
  clientes: number;
  pedidos: number;
}

export interface Pareto {
  top20: number;
  curva: { clientes: number; ingresos: number }[];
}

export interface RespuestaAsistente {
  texto: string;
  consulta: string;
  sugerencias: string[];
  tabla: { columnas: string[]; filas: string[][] } | null;
}
