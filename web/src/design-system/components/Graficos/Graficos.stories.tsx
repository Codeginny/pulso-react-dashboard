import type { Meta, StoryObj } from '@storybook/react';
import { GraficoBarras, GraficoPareto, GraficoTendencia } from './Graficos';

const SERIE = [
  ['2010-12', 565200, 76],
  ['2011-01', 562683, 72],
  ['2011-02', 442294, 125],
  ['2011-03', 583144, 179],
  ['2011-04', 454441, 106],
  ['2011-05', 659242, 111],
  ['2011-06', 653265, 108],
  ['2011-07', 591604, 101],
  ['2011-08', 635514, 107],
  ['2011-09', 938753, 188],
  ['2011-10', 1002327, 221],
  ['2011-11', 1136534, 191],
].map(([mes, ingresos, clientesNuevos]) => ({ mes: mes as string, ingresos: ingresos as number, clientesNuevos: clientesNuevos as number }));

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const mes = (v: string) => `${MESES[Number(v.slice(5)) - 1]} ${v.slice(2, 4)}`;
const miles = (v: number) => `£ ${Math.round(v / 1000)} k`;

const CURVA = Array.from({ length: 100 }, (_, i) => ({ clientes: i + 1, ingresos: Number((100 * (1 - Math.pow(1 - (i + 1) / 100, 7))).toFixed(1)) }));

function Galeria() {
  return null;
}

const meta = {
  title: 'Datos/Graficos',
  component: Galeria,
  parameters: {
    docs: {
      description: {
        component:
          'Envoltorios de Recharts que toman los colores de los tokens (`--grafico-1..3`), así cambian solos con el tema. Cada gráfico lleva `role="img"` con una descripción y una **tabla equivalente oculta** para lectores de pantalla. `initialDimension` permite renderizarlos en el servidor (SSR) antes de medir el contenedor.',
      },
    },
  },
} satisfies Meta<typeof Galeria>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Tendencia: Story = {
  render: () => (
    <GraficoTendencia
      titulo="Ingresos y clientes nuevos por mes"
      datos={SERIE}
      claveX="mes"
      series={[
        { clave: 'ingresos', nombre: 'Ingresos', tipo: 'area', color: 1 },
        { clave: 'clientesNuevos', nombre: 'Clientes nuevos', tipo: 'barra', color: 2, ejeDerecho: true },
      ]}
      formatoX={mes}
      formatoY={miles}
    />
  ),
};

export const Barras: Story = {
  render: () => (
    <GraficoBarras
      titulo="Países con más ingresos"
      datos={[
        { etiqueta: 'Reino Unido', valor: 6773526 },
        { etiqueta: 'Países Bajos', valor: 283480 },
        { etiqueta: 'Irlanda', valor: 260300 },
        { etiqueta: 'Alemania', valor: 205381 },
        { etiqueta: 'Francia', valor: 183018 },
      ]}
      formato={miles}
    />
  ),
};

export const Pareto: Story = { render: () => <GraficoPareto curva={CURVA} /> };
