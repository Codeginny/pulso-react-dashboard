import { entero, formatearKpi, mes, moneda, porcentaje, variacion } from './formato';

// Intl usa espacios duros entre símbolo y número; los normalizo para comparar.
const n = (s: string) => s.replace(/\s/g, ' ');

describe('formato', () => {
  it('formatea montos en libras con separador de miles argentino', () => {
    expect(n(moneda(8225000))).toBe('£ 8.225.000');
  });

  it('formatea enteros y porcentajes en es-AR', () => {
    expect(entero(5824)).toBe('5.824');
    expect(n(porcentaje(0.1992))).toBe('19,9%');
  });

  it('elige el formato según el tipo de KPI', () => {
    expect(n(formatearKpi(0.5, 'PORCENTAJE'))).toBe('50%');
    expect(formatearKpi(1234.4, 'ENTERO')).toBe('1.234');
  });

  it('muestra los meses abreviados en español', () => {
    expect(mes('2011-03')).toBe('mar 2011');
    expect(mes('2010-12', true)).toBe('dic 10');
  });

  it('agrega el signo a la variación', () => {
    expect(n(variacion(0.034))).toBe('+3,4%');
    expect(n(variacion(-0.12))).toBe('−12%');
    expect(n(variacion(0))).toBe('0%');
  });
});
