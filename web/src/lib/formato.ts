import type { FormatoKpi } from '../api/tipos';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const monedaFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'GBP', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 });
const monedaCorta = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'GBP', currencyDisplay: 'narrowSymbol', notation: 'compact', maximumFractionDigits: 1 });
const enteroFmt = new Intl.NumberFormat('es-AR');
const porcentajeFmt = new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: 1 });

export const moneda = (v: number) => monedaFmt.format(v);
export const monedaCompacta = (v: number) => (v === 0 ? moneda(0) : monedaCorta.format(v));
export const entero = (v: number) => enteroFmt.format(Math.round(v));
/** Recibe una proporción: 0.125 → "12,5%". */
export const porcentaje = (v: number) => porcentajeFmt.format(v);

export function formatearKpi(valor: number, formato: FormatoKpi): string {
  if (formato === 'MONEDA') return moneda(valor);
  if (formato === 'PORCENTAJE') return porcentaje(valor);
  return entero(valor);
}

/** "2011-03" → "mar 2011"; con corto, "mar 11". */
export function mes(valor: string, corto = false): string {
  const [anio, m] = valor.split('-');
  return `${MESES[Number(m) - 1]} ${corto ? anio!.slice(2) : anio}`;
}

/** Variación con signo: 0.034 → "+3,4%". */
export function variacion(v: number): string {
  const texto = porcentajeFmt.format(Math.abs(v));
  if (Math.abs(v) < 0.0005) return texto;
  return `${v > 0 ? '+' : '−'}${texto}`;
}
