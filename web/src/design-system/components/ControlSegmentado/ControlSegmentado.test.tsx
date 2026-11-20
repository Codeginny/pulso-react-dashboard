import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ControlSegmentado } from './ControlSegmentado';

const OPCIONES = [
  { valor: 'a', etiqueta: '3 meses' },
  { valor: 'b', etiqueta: '6 meses' },
  { valor: 'c', etiqueta: '12 meses' },
];

function Controlado() {
  const [valor, setValor] = useState('a');
  return <ControlSegmentado etiqueta="Período" opciones={OPCIONES} valor={valor} onCambio={setValor} />;
}

describe('ControlSegmentado', () => {
  it('expone un radiogroup con nombre y la opción elegida marcada', () => {
    render(<Controlado />);
    expect(screen.getByRole('radiogroup', { name: 'Período' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '3 meses' })).toBeChecked();
  });

  it('cambia con clic', async () => {
    render(<Controlado />);
    await userEvent.click(screen.getByRole('radio', { name: '12 meses' }));
    expect(screen.getByRole('radio', { name: '12 meses' })).toBeChecked();
  });

  it('sólo la opción activa entra en el orden de tabulación y las flechas mueven la selección', async () => {
    render(<Controlado />);
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: '3 meses' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: '6 meses' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '6 meses' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('radio', { name: '12 meses' })).toBeChecked();
  });
});
