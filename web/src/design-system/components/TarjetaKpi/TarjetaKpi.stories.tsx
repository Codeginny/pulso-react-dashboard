import type { Meta, StoryObj } from '@storybook/react';
import { TarjetaKpi } from './TarjetaKpi';

const meta = {
  title: 'Datos/TarjetaKpi',
  component: TarjetaKpi,
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ maxWidth: 280 }}><Story /></div>],
  args: { etiqueta: 'Ingresos', valor: '£ 8.225.000', variacion: 0.034, comparaCon: 'dic 2009 – nov 2010' },
  parameters: {
    docs: {
      description: {
        component:
          'Un indicador con su variación. El color dice si el cambio es **bueno o malo**, no si sube o baja: con `mejorSiSube=false` (devoluciones, costos) una suba se pinta en rojo. Para lectores de pantalla se anuncia "Subió 3,4 %, buena señal", porque el color solo no alcanza (WCAG 1.4.1).',
      },
    },
  },
} satisfies Meta<typeof TarjetaKpi>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SubaFavorable: Story = {};
export const BajaDesfavorable: Story = { args: { etiqueta: 'Pedidos', valor: '17.626', variacion: -0.031 } };
export const SubaDesfavorable: Story = {
  args: { etiqueta: 'Devoluciones por pedido', valor: '19,9%', variacion: 0.08, mejorSiSube: false },
};
export const Destacada: Story = { args: { destacada: true } };
export const SinComparacion: Story = {
  args: { etiqueta: 'Clientes nuevos', valor: '1.585', variacion: null, sinComparacion: 'Sin comparación: antes de dic 2009 no hay historia' },
};
