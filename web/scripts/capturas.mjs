// Capturas del tablero para el README y el caso de estudio.
// Uso: con la API y el servidor web corriendo, `node scripts/capturas.mjs [url-base] [url-storybook]`.
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://localhost:5173';
const STORYBOOK = process.argv[3] ?? 'http://localhost:6006';
const SALIDA = new URL('../../docs/capturas/', import.meta.url);

const CAPTURAS = [
  { nombre: '01-resumen-claro', ruta: '/', tema: 'claro' },
  { nombre: '02-resumen-oscuro', ruta: '/', tema: 'oscuro' },
  { nombre: '03-clientes', ruta: '/clientes', tema: 'claro', antes: (p) => p.getByRole('button', { name: /^No se pueden perder/ }).click() },
  { nombre: '04-retencion', ruta: '/retencion', tema: 'claro' },
  { nombre: '05-productos', ruta: '/productos?periodo=ULTIMOS_3_MESES', tema: 'oscuro' },
  {
    nombre: '06-asistente',
    ruta: '/asistente',
    tema: 'claro',
    antes: async (p) => {
      await p.getByRole('button', { name: '¿Qué segmento conviene reactivar?' }).click();
      await p.getByText(/Conviene empezar por/).waitFor();
      await p.getByRole('button', { name: '¿Cuáles son los productos más vendidos?' }).click();
      await p.getByText(/El producto que más ingresos/).waitFor();
    },
  },
];

await mkdir(SALIDA, { recursive: true });
const navegador = await chromium.launch();

async function contexto(tema, opciones = {}) {
  const ctx = await navegador.newContext({ deviceScaleFactor: 2, locale: 'es-AR', ...opciones });
  await ctx.addCookies([{ name: 'pulso-preferencias', value: `${tema}%7Ccomoda`, url: BASE }]);
  return ctx;
}

for (const c of CAPTURAS) {
  const ctx = await contexto(c.tema, { viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(BASE + c.ruta, { waitUntil: 'networkidle' });
  if (c.antes) await c.antes(p);
  await p.waitForTimeout(400);
  await p.screenshot({ path: new URL(`${c.nombre}.png`, SALIDA).pathname, fullPage: c.nombre !== '01-resumen-claro' && c.nombre !== '02-resumen-oscuro' });
  await ctx.close();
  console.log(c.nombre);
}

// Celular: resumen y clientes.
for (const [nombre, ruta] of [['07-celular-resumen', '/'], ['08-celular-clientes', '/clientes']]) {
  const ctx = await contexto('claro', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(BASE + ruta, { waitUntil: 'networkidle' });
  if (ruta === '/clientes') await p.getByRole('table', { name: 'Clientes' }).scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  await p.screenshot({ path: new URL(`${nombre}.png`, SALIDA).pathname });
  await ctx.close();
  console.log(nombre);
}

// Storybook: introducción y una historia con el panel de accesibilidad.
const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
for (const [nombre, ruta] of [
  ['09-storybook-tokens', '?path=/story/fundamentos-tokens--todos&globals=tema:claro'],
  ['10-storybook-tabla', '?path=/story/datos-tabladatos--con-paginacion&globals=tema:oscuro&addonPanel=storybook/a11y/panel'],
]) {
  await p.goto(`${STORYBOOK}/${ruta}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: new URL(`${nombre}.png`, SALIDA).pathname });
  console.log(nombre);
}
await navegador.close();
