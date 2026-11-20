import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import { Boton } from './Boton/Boton';
import { Alerta, EstadoVacio, Esqueleto } from './Estados/Estados';
import { Etiqueta } from './Etiqueta/Etiqueta';
import { MapaCalor } from './MapaCalor/MapaCalor';
import { MensajeChat, Sugerencias } from './MensajeChat/MensajeChat';
import { Selector } from './Selector/Selector';
import { Tarjeta } from './Tarjeta/Tarjeta';

function Galeria() {
  return null;
}

const meta = {
  title: 'Patrones/Estados y chat',
  component: Galeria,
  parameters: {
    docs: {
      description: {
        component:
          'Cada vista de datos tiene **cinco estados**: ideal, cargando, vacío, error y parcial. El esqueleto copia la forma del contenido para que la página no salte; el error usa `role="alert"` y ofrece reintentar.',
      },
    },
  },
} satisfies Meta<typeof Galeria>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Carga: Story = {
  render: () => (
    <Tarjeta titulo="Ingresos por mes">
      <Esqueleto alto={16} lineas={3} />
    </Tarjeta>
  ),
};

export const Vacio: Story = {
  render: () => (
    <Tarjeta titulo="Clientes">
      <EstadoVacio titulo="Ningún cliente coincide con la búsqueda" accion={<Boton variante="secundario">Limpiar filtros</Boton>}>
        Probá con otro número de cliente o con el nombre del país.
      </EstadoVacio>
    </Tarjeta>
  ),
};

export const ConError: Story = {
  render: () => (
    <Alerta titulo="No pudimos cargar el resumen" onReintentar={fn()}>
      La API de datos no responde.
    </Alerta>
  ),
};

export const Etiquetas: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Etiqueta tono="primario">Campeones</Etiqueta>
      <Etiqueta tono="exito">Potenciales</Etiqueta>
      <Etiqueta tono="peligro">En riesgo</Etiqueta>
      <Etiqueta tono="acento">Hibernando</Etiqueta>
      <Etiqueta>Perdidos</Etiqueta>
    </div>
  ),
};

export const SelectorRegion: Story = {
  render: function Render() {
    const [v, setV] = useState('TODAS');
    return (
      <Selector
        etiqueta="Región"
        valor={v}
        onCambio={setV}
        opciones={[
          { valor: 'TODAS', etiqueta: 'Todas las regiones' },
          { valor: 'REINO_UNIDO', etiqueta: 'Reino Unido' },
          { valor: 'INTERNACIONAL', etiqueta: 'Internacional' },
        ]}
      />
    );
  },
};

export const MapaDeCalor: Story = {
  render: () => (
    <MapaCalor
      titulo="Retención por cohorte"
      columnas={['Mes 0', 'Mes 1', 'Mes 2', 'Mes 3', 'Mes 4']}
      formato={(v) => `${v.toLocaleString('es-AR')} %`}
      filas={[
        { etiqueta: 'dic 2010', total: '76', valores: [100, 9.2, 5.3, 9.2, 11.8] },
        { etiqueta: 'ene 2011', total: '72', valores: [100, 16.7, 22.2, 19.4, 22.2] },
        { etiqueta: 'feb 2011', total: '125', valores: [100, 16, 16, 18.4] },
        { etiqueta: 'mar 2011', total: '179', valores: [100, 17.9, 21.8] },
        { etiqueta: 'abr 2011', total: '106', valores: [100, 24.5] },
      ]}
    />
  ),
};

export const Chat: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
      <ol role="log" aria-label="Conversación" style={{ display: 'grid', gap: 12, padding: 0, margin: 0 }}>
        <MensajeChat rol="usuario">
          <p>¿Qué segmento conviene reactivar?</p>
        </MensajeChat>
        <MensajeChat rol="asistente" detalle={<code>segmentos(region: TODAS)</code>}>
          <p>
            Conviene empezar por «En riesgo»: 1.248 clientes que generaron £ 1.217.456 y hace en promedio 229 días que no compran. Acción sugerida:
            campaña de reactivación con oferta personalizada.
          </p>
        </MensajeChat>
      </ol>
      <Sugerencias opciones={['¿Cuánto facturamos?', '¿Cuál fue el mejor mes?']} onElegir={fn()} />
    </div>
  ),
};
