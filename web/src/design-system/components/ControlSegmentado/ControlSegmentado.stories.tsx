import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { useState } from 'react';
import { ControlSegmentado } from './ControlSegmentado';

const OPCIONES = [
  { valor: 'ULTIMOS_3_MESES', etiqueta: '3 meses' },
  { valor: 'ULTIMOS_6_MESES', etiqueta: '6 meses' },
  { valor: 'ULTIMOS_12_MESES', etiqueta: '12 meses' },
  { valor: 'TODO', etiqueta: 'Todo' },
];

function Demo({ ocultarEtiqueta }: { ocultarEtiqueta?: boolean }) {
  const [valor, setValor] = useState('ULTIMOS_12_MESES');
  return <ControlSegmentado etiqueta="Período" opciones={OPCIONES} valor={valor} onCambio={setValor} ocultarEtiqueta={ocultarEtiqueta} />;
}

const meta = {
  title: 'Componentes/ControlSegmentado',
  component: Demo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Para 2 a 5 opciones excluyentes que conviene ver todas juntas (el período del tablero). Sigue el patrón **radiogroup** de ARIA: Tab entra al grupo en la opción activa y las flechas cambian la opción. Con más de 5 opciones, usar `Selector`.',
      },
    },
  },
} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Periodo: Story = {};
export const EtiquetaOculta: Story = { args: { ocultarEtiqueta: true } };

/** Prueba de interacción: se ejecuta en el panel Interactions y en CI. */
export const NavegacionConTeclado: Story = {
  play: async ({ canvasElement }) => {
    const lienzo = within(canvasElement);
    await userEvent.tab();
    await expect(lienzo.getByRole('radio', { name: '12 meses' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(lienzo.getByRole('radio', { name: 'Todo' })).toBeChecked();
  },
};
