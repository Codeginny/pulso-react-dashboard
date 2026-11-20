import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TablaDatos, type Columna } from './TablaDatos';

interface Fila {
  id: string;
  pais: string;
  monto: number;
}

const COLUMNAS: Columna<Fila>[] = [
  { clave: 'pais', titulo: 'País', render: (f) => f.pais },
  { clave: 'monto', titulo: 'Monto', render: (f) => f.monto, alinear: 'derecha', orden: 'MONTO' },
];

const FILAS: Fila[] = [
  { id: '1', pais: 'Alemania', monto: 10 },
  { id: '2', pais: 'Francia', monto: 5 },
];

describe('TablaDatos', () => {
  it('renderiza una tabla semántica con caption y encabezados de columna', () => {
    render(<TablaDatos titulo="Países" columnas={COLUMNAS} filas={FILAS} claveFila={(f) => f.id} />);
    const tabla = screen.getByRole('table', { name: 'Países' });
    expect(within(tabla).getAllByRole('columnheader')).toHaveLength(2);
    expect(within(tabla).getAllByRole('row')).toHaveLength(3);
  });

  it('marca la columna ordenada con aria-sort y avisa al ordenar', async () => {
    const onOrdenar = jest.fn();
    render(<TablaDatos titulo="Países" columnas={COLUMNAS} filas={FILAS} claveFila={(f) => f.id} ordenActual="MONTO" onOrdenar={onOrdenar} />);
    expect(screen.getByRole('columnheader', { name: /Monto/ })).toHaveAttribute('aria-sort', 'descending');
    await userEvent.click(screen.getByRole('button', { name: /Monto/ }));
    expect(onOrdenar).toHaveBeenCalledWith('MONTO');
  });

  it('muestra el mensaje de vacío ocupando todas las columnas', () => {
    render(<TablaDatos titulo="Países" columnas={COLUMNAS} filas={[]} claveFila={(f) => f.id} vacio="Sin resultados" />);
    expect(screen.getByRole('cell', { name: 'Sin resultados' })).toHaveAttribute('colspan', '2');
  });

  it('cada celda lleva su encabezado para la vista de tarjetas en celular', () => {
    render(<TablaDatos titulo="Países" columnas={COLUMNAS} filas={FILAS} claveFila={(f) => f.id} />);
    expect(screen.getByRole('cell', { name: 'Alemania' })).toHaveAttribute('data-titulo', 'País');
  });
});
