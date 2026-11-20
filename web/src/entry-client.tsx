import { QueryClient } from '@tanstack/react-query';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { opcionesConsultas, Raiz, type EstadoInicial } from './Raiz';
import { FILTROS_INICIALES, PREFERENCIAS_INICIALES } from './store/estado';

declare global {
  interface Window {
    __PULSO__?: EstadoInicial;
  }
}

const estado: EstadoInicial = window.__PULSO__ ?? { filtros: FILTROS_INICIALES, preferencias: PREFERENCIAS_INICIALES };
const cliente = new QueryClient({ defaultOptions: opcionesConsultas });

hydrateRoot(
  document.getElementById('raiz')!,
  <Raiz cliente={cliente} estado={estado} router={(app) => <BrowserRouter>{app}</BrowserRouter>} />,
);
