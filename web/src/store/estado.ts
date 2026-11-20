import type { Periodo, Region } from '../api/tipos';

export type Tema = 'claro' | 'oscuro' | 'sistema';
export type Densidad = 'comoda' | 'compacta';

export const PERIODOS: { valor: Periodo; etiqueta: string }[] = [
  { valor: 'ULTIMOS_3_MESES', etiqueta: '3 meses' },
  { valor: 'ULTIMOS_6_MESES', etiqueta: '6 meses' },
  { valor: 'ULTIMOS_12_MESES', etiqueta: '12 meses' },
  { valor: 'TODO', etiqueta: 'Todo' },
];

export const REGIONES: { valor: Region; etiqueta: string }[] = [
  { valor: 'TODAS', etiqueta: 'Todas las regiones' },
  { valor: 'REINO_UNIDO', etiqueta: 'Reino Unido' },
  { valor: 'INTERNACIONAL', etiqueta: 'Internacional' },
];

export const FILTROS_INICIALES = { periodo: 'ULTIMOS_12_MESES' as Periodo, region: 'TODAS' as Region };
export const PREFERENCIAS_INICIALES = { tema: 'sistema' as Tema, densidad: 'comoda' as Densidad };

const PARAM = { periodo: 'periodo', region: 'region' } as const;

/** Los filtros viven en la URL para que una vista filtrada se pueda compartir y el servidor la renderice igual. */
export function filtrosDesdeUrl(search: string) {
  const p = new URLSearchParams(search);
  const periodo = p.get(PARAM.periodo) as Periodo | null;
  const region = p.get(PARAM.region) as Region | null;
  return {
    periodo: PERIODOS.some((x) => x.valor === periodo) ? periodo! : FILTROS_INICIALES.periodo,
    region: REGIONES.some((x) => x.valor === region) ? region! : FILTROS_INICIALES.region,
  };
}

export function filtrosAUrl(search: string, filtros: { periodo: Periodo; region: Region }): string {
  const p = new URLSearchParams(search);
  for (const clave of ['periodo', 'region'] as const) {
    if (filtros[clave] === FILTROS_INICIALES[clave]) p.delete(PARAM[clave]);
    else p.set(PARAM[clave], filtros[clave]);
  }
  const texto = p.toString();
  return texto ? `?${texto}` : '';
}

const COOKIE = 'pulso-preferencias';

/** Las preferencias van en una cookie para que el servidor pinte el tema correcto y no haya parpadeo. */
export function preferenciasDesdeCookies(cookies: string) {
  const crudo = cookies
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  const [tema, densidad] = decodeURIComponent(crudo ?? '').split('|');
  return {
    tema: (['claro', 'oscuro', 'sistema'] as const).includes(tema as Tema) ? (tema as Tema) : PREFERENCIAS_INICIALES.tema,
    densidad: densidad === 'compacta' ? 'compacta' : PREFERENCIAS_INICIALES.densidad,
  } as { tema: Tema; densidad: Densidad };
}

export function guardarPreferencias(tema: Tema, densidad: Densidad) {
  document.cookie = `${COOKIE}=${encodeURIComponent(`${tema}|${densidad}`)}; path=/; max-age=31536000; samesite=lax`;
}

export function atributosTema(tema: Tema, densidad: Densidad): Record<string, string> {
  return { ...(tema !== 'sistema' && { 'data-tema': tema }), 'data-densidad': densidad };
}
