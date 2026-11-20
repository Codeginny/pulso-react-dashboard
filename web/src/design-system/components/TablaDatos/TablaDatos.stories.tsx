import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Etiqueta } from '../Etiqueta/Etiqueta';
import { Paginacion } from '../Paginacion/Paginacion';
import { TablaDatos, type Columna } from './TablaDatos';

interface Cliente {
  id: string;
  pais: string;
  segmento: string;
  recencia: number;
  monto: number;
}

const FILAS: Cliente[] = [
  { id: '18102', pais: 'Reino Unido', segmento: 'Campeones', recencia: 2, monto: 569502 },
  { id: '14646', pais: 'Países Bajos', segmento: 'Campeones', recencia: 3, monto: 517146 },
  { id: '14156', pais: 'Irlanda', segmento: 'Campeones', recencia: 11, monto: 306640 },
  { id: '12346', pais: 'Reino Unido', segmento: 'No se pueden perder', recencia: 316, monto: 77556 },
  { id: '17850', pais: 'Reino Unido', segmento: 'En riesgo', recencia: 363, monto: 55093 },
];

const lb = (v: number) => `£ ${v.toLocaleString('es-AR')}`;

const COLUMNAS: Columna<Cliente>[] = [
  { clave: 'id', titulo: 'Cliente', render: (c) => `#${c.id}` },
  { clave: 'pais', titulo: 'País', render: (c) => c.pais },
  {
    clave: 'segmento',
    titulo: 'Segmento',
    render: (c) => <Etiqueta tono={c.segmento === 'Campeones' ? 'primario' : 'peligro'}>{c.segmento}</Etiqueta>,
  },
  { clave: 'recencia', titulo: 'Días sin comprar', render: (c) => c.recencia, alinear: 'derecha', orden: 'RECENCIA' },
  { clave: 'monto', titulo: 'Ingresos', render: (c) => lb(c.monto), alinear: 'derecha', orden: 'MONTO' },
];

function Demo({ vacia = false, cargando = false }: { vacia?: boolean; cargando?: boolean }) {
  const [orden, setOrden] = useState('MONTO');
  const [pagina, setPagina] = useState(1);
  const filas = [...FILAS].sort((a, b) => (orden === 'MONTO' ? b.monto - a.monto : a.recencia - b.recencia));
  return (
    <>
      <TablaDatos
        titulo="Clientes"
        columnas={COLUMNAS}
        filas={vacia ? [] : filas}
        claveFila={(c) => c.id}
        ordenActual={orden}
        onOrdenar={setOrden}
        cargando={cargando}
        vacio="Ningún cliente coincide con la búsqueda."
      />
      {!vacia && <Paginacion pagina={pagina} porPagina={5} total={5824} onCambio={setPagina} />}
    </>
  );
}

const meta = {
  title: 'Datos/TablaDatos',
  component: Demo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Tabla semántica (`<table>`, `<caption>`, `scope="col"`) con números tabulares alineados a la derecha para comparar de un vistazo. Los encabezados ordenables son botones y la columna activa lleva `aria-sort`. **Debajo de 768 px cada fila se apila como tarjeta** y cada celda muestra su encabezado. Probá la densidad compacta desde la barra superior.',
      },
    },
  },
} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ConPaginacion: Story = {};
export const Cargando: Story = { args: { cargando: true } };
export const SinResultados: Story = { args: { vacia: true } };
export const Celular: Story = { parameters: { viewport: { defaultViewport: 'mobile1' } } };
