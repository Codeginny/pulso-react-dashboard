import type { Decorator, Preview } from '@storybook/react';
import { useEffect } from 'react';
import '../src/design-system/tokens/global.scss';

/** Aplica el tema elegido en la barra de Storybook igual que lo hace la app. */
const conTema: Decorator = (Story, contexto) => {
  const tema = contexto.globals.tema as string;
  const densidad = contexto.globals.densidad as string;
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-tema', tema);
    html.setAttribute('data-densidad', densidad);
  }, [tema, densidad]);
  return (
    <div style={{ padding: 24, background: 'var(--color-fondo)', color: 'var(--color-texto)', minHeight: '100%' }}>
      <Story />
    </div>
  );
};

const preview: Preview = {
  decorators: [conTema],
  globalTypes: {
    tema: {
      description: 'Tema de color',
      toolbar: { title: 'Tema', icon: 'mirror', items: [{ value: 'claro', title: 'Claro' }, { value: 'oscuro', title: 'Oscuro' }], dynamicTitle: true },
    },
    densidad: {
      description: 'Densidad de tablas',
      toolbar: { title: 'Densidad', icon: 'component', items: [{ value: 'comoda', title: 'Cómoda' }, { value: 'compacta', title: 'Compacta' }], dynamicTitle: true },
    },
  },
  initialGlobals: { tema: 'claro', densidad: 'comoda' },
  parameters: {
    layout: 'fullscreen',
    controls: { matchers: { color: /(background|color)$/i } },
    // El addon a11y corre axe-core en cada historia; con 'error' la build de CI falla si hay violaciones.
    a11y: { test: 'error' },
    options: { storySort: { order: ['Introducción', 'Fundamentos', 'Componentes', 'Datos', 'Patrones'] } },
  },
};

export default preview;
