import { atributosTema, filtrosAUrl, filtrosDesdeUrl, preferenciasDesdeCookies } from './estado';

describe('filtros en la URL', () => {
  it('lee los filtros válidos y usa los valores por defecto para el resto', () => {
    expect(filtrosDesdeUrl('?periodo=ULTIMOS_3_MESES&region=CUALQUIERA')).toEqual({ periodo: 'ULTIMOS_3_MESES', region: 'TODAS' });
  });

  it('no ensucia la URL con los valores por defecto y conserva otros parámetros', () => {
    expect(filtrosAUrl('?x=1', { periodo: 'ULTIMOS_12_MESES', region: 'TODAS' })).toBe('?x=1');
    expect(filtrosAUrl('', { periodo: 'TODO', region: 'REINO_UNIDO' })).toBe('?periodo=TODO&region=REINO_UNIDO');
  });

  it('ida y vuelta conserva los filtros', () => {
    const f = { periodo: 'ULTIMOS_6_MESES', region: 'INTERNACIONAL' } as const;
    expect(filtrosDesdeUrl(filtrosAUrl('', f))).toEqual(f);
  });
});

describe('preferencias en cookie', () => {
  it('lee tema y densidad de la cookie', () => {
    expect(preferenciasDesdeCookies('otra=1; pulso-preferencias=oscuro%7Ccompacta')).toEqual({ tema: 'oscuro', densidad: 'compacta' });
  });

  it('ignora valores inválidos', () => {
    expect(preferenciasDesdeCookies('pulso-preferencias=rosa%7Cenorme')).toEqual({ tema: 'sistema', densidad: 'comoda' });
  });

  it('con tema del sistema no fija data-tema, así manda prefers-color-scheme', () => {
    expect(atributosTema('sistema', 'comoda')).toEqual({ 'data-densidad': 'comoda' });
    expect(atributosTema('claro', 'compacta')).toEqual({ 'data-tema': 'claro', 'data-densidad': 'compacta' });
  });
});
