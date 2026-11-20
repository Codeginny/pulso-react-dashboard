import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Boton } from './Boton';

const meta = {
  title: 'Componentes/Boton',
  component: Boton,
  tags: ['autodocs'],
  args: { children: 'Preguntar', onClick: fn() },
  argTypes: {
    variante: { control: 'inline-radio', options: ['primario', 'secundario', 'fantasma'] },
    tamanio: { control: 'inline-radio', options: ['s', 'm'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Botón nativo (`<button>`), así teclado, foco y lector de pantalla funcionan sin trabajo extra. Usar **una sola acción primaria por zona**. `cargando` lo deshabilita y marca `aria-busy`. Alto mínimo de 44 px en tamaño `m`.',
      },
    },
  },
} satisfies Meta<typeof Boton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primario: Story = {};
export const Secundario: Story = { args: { variante: 'secundario', children: 'Reintentar' } };
export const Fantasma: Story = { args: { variante: 'fantasma', children: 'Cancelar' } };
export const Chico: Story = { args: { variante: 'secundario', tamanio: 's', children: 'Siguiente' } };
export const Cargando: Story = { args: { cargando: true } };
export const Deshabilitado: Story = { args: { disabled: true } };
