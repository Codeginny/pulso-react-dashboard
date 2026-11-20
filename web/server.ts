/**
 * Servidor de Pulso: renderiza cada página en el servidor (SSR) con los datos
 * ya cargados y hace de proxy hacia la API GraphQL, así el navegador habla con
 * un solo origen y la URL de la API nunca queda expuesta.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import express from 'express';
import type { ViteDevServer } from 'vite';

const produccion = process.env.NODE_ENV === 'production';
const puerto = Number(process.env.PORT ?? 5173);
const API_URL = process.env.API_URL ?? 'http://localhost:4000';
const raiz = path.dirname(fileURLToPath(import.meta.url));

type Render = (url: string, cookies: string) => Promise<{
  html: string;
  estado: string;
  titulo: string;
  atributosHtml: string;
  status: number;
}>;

async function crearServidor() {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });

  app.post('/graphql', express.json({ limit: '20kb' }), async (req, res) => {
    try {
      const respuesta = await fetch(`${API_URL}/graphql`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      res.status(respuesta.status).type('application/json').send(await respuesta.text());
    } catch {
      res.status(502).json({ errors: [{ message: 'La API de datos no responde.' }] });
    }
  });

  let vite: ViteDevServer | undefined;
  let plantilla = '';
  let render: Render;

  if (produccion) {
    app.use(compression());
    app.use(express.static(path.join(raiz, 'client'), { index: false, maxAge: '1y', immutable: true }));
    plantilla = await fs.readFile(path.join(raiz, 'client/index.html'), 'utf-8');
    // @ts-expect-error: el bundle SSR se genera en el build.
    render = (await import('./server/entry-server.js')).render;
  } else {
    const { createServer } = await import('vite');
    vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
    app.use(vite.middlewares);
  }

  app.use('*', async (req, res) => {
    const url = req.originalUrl;
    try {
      if (vite) {
        plantilla = await vite.transformIndexHtml(url, await fs.readFile(path.join(raiz, 'index.html'), 'utf-8'));
        render = (await vite.ssrLoadModule('/src/entry-server.tsx')).render;
      }
      const r = await render(url, req.headers.cookie ?? '');
      const html = plantilla
        .replace(' data-ssr-atributos', r.atributosHtml)
        .replace('<!--app-title-->', r.titulo)
        .replace('<!--app-html-->', r.html)
        .replace('<!--app-state-->', r.estado);
      res.status(r.status).type('html').send(html);
    } catch (e) {
      vite?.ssrFixStacktrace(e as Error);
      console.error(e);
      res.status(500).type('text').send('Error al renderizar la página.');
    }
  });

  app.listen(puerto, () => console.log(`Pulso en http://localhost:${puerto} (API: ${API_URL})`));
}

crearServidor();
