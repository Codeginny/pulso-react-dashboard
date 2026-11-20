import { dehydrate, QueryClient } from '@tanstack/react-query';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { configurarApi } from './api/cliente';
import { opcionesConsultas, Raiz, type EstadoInicial } from './Raiz';
import { rutaPorPath } from './rutas';
import { atributosTema, filtrosDesdeUrl, preferenciasDesdeCookies } from './store/estado';

configurarApi(process.env.API_URL ?? 'http://localhost:4000');

/** Serializa el estado para un <script> sin permitir que cierre la etiqueta (XSS). */
const serializar = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');

export async function render(url: string, cookies: string) {
  const { pathname, search } = new URL(url, 'http://pulso.local');
  const filtros = filtrosDesdeUrl(search);
  const preferencias = preferenciasDesdeCookies(cookies);
  const ruta = rutaPorPath(pathname);

  const cliente = new QueryClient({ defaultOptions: { queries: { ...opcionesConsultas.queries, retry: false } } });
  // Si la API falla, la página igual se renderiza y el navegador reintenta la consulta.
  if (ruta) await Promise.allSettled(ruta.precargar(cliente, filtros));

  const estado: EstadoInicial = { consultas: dehydrate(cliente), filtros, preferencias };
  const html = renderToString(
    <Raiz cliente={cliente} estado={estado} router={(app) => <StaticRouter location={url}>{app}</StaticRouter>} />,
  );
  cliente.clear();

  const atributos = Object.entries(atributosTema(preferencias.tema, preferencias.densidad))
    .map(([k, v]) => ` ${k}="${v}"`)
    .join('');

  return {
    html,
    estado: `<script>window.__PULSO__=${serializar(estado)}</script>`,
    titulo: `${ruta?.titulo ?? 'Página no encontrada'} · Pulso`,
    atributosHtml: atributos,
    status: ruta ? 200 : 404,
  };
}
