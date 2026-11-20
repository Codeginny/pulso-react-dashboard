import type { Meta, StoryObj } from '@storybook/react';

const COLORES = [
  ['--color-fondo', 'Fondo de la página'],
  ['--color-superficie', 'Tarjetas y paneles'],
  ['--color-superficie-2', 'Hover y fondos secundarios'],
  ['--color-borde', 'Bordes y divisores'],
  ['--color-texto', 'Texto principal'],
  ['--color-texto-suave', 'Texto secundario'],
  ['--color-primario', 'Acciones y estado activo'],
  ['--color-primario-suave', 'Fondo del estado activo'],
  ['--color-acento', 'Advertencias suaves'],
  ['--color-exito', 'Variación favorable'],
  ['--color-peligro', 'Variación desfavorable y errores'],
  ['--color-foco', 'Contorno de foco'],
  ['--grafico-1', 'Serie principal de gráficos'],
  ['--grafico-2', 'Serie secundaria'],
  ['--grafico-3', 'Tercera serie'],
];

const ESPACIOS = ['--esp-1', '--esp-2', '--esp-3', '--esp-4', '--esp-5', '--esp-6', '--esp-7'];
const TEXTOS = ['--texto-xs', '--texto-s', '--texto-m', '--texto-l', '--texto-xl'];

function Tokens() {
  return (
    <div style={{ display: 'grid', gap: 32 }}>
      <section>
        <h2 style={{ marginBottom: 12 }}>Colores semánticos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {COLORES.map(([token, uso]) => (
            <div key={token} style={{ border: '1px solid var(--color-borde)', borderRadius: 10, overflow: 'hidden', background: 'var(--color-superficie)' }}>
              <div style={{ height: 56, background: `var(${token})` }} />
              <div style={{ padding: 10, fontSize: 13 }}>
                <code>{token}</code>
                <p style={{ color: 'var(--color-texto-suave)' }}>{uso}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 style={{ marginBottom: 12 }}>Espaciado (grilla de 8)</h2>
        {ESPACIOS.map((t) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <code style={{ width: 80 }}>{t}</code>
            <span style={{ height: 12, width: `var(${t})`, background: 'var(--color-primario)', borderRadius: 3 }} />
          </div>
        ))}
      </section>
      <section>
        <h2 style={{ marginBottom: 12 }}>Tipografía (Inter)</h2>
        {TEXTOS.map((t) => (
          <p key={t} style={{ fontSize: `var(${t})` }}>
            <code style={{ fontSize: 12, marginRight: 12 }}>{t}</code>Ingresos del período
          </p>
        ))}
      </section>
    </div>
  );
}

const meta: Meta = {
  title: 'Fundamentos/Tokens',
  component: Tokens,
  parameters: { docs: { description: { component: 'Tokens semánticos: cambian de valor con el tema; los componentes sólo usan estos.' } } },
};
export default meta;

export const Todos: StoryObj = {};
