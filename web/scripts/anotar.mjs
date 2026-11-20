// Capturas anotadas para el caso de estudio: un recorte con zoom de una sola zona de la pantalla
// real, agrandado, con etiquetas grandes numeradas en una columna a la derecha (celestes = algo
// que funciona, ámbar = algo para mejorar) y una flecha curva hacia cada punto.
// Uso: con la API y el servidor web corriendo,
// `node scripts/anotar.mjs [carpeta-salida] [nombre]` (BASE_URL y STORYBOOK_URL por entorno).
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const STORYBOOK = process.env.STORYBOOK_URL ?? 'http://localhost:6006';
const OUT = process.argv[2] ?? '../docs/capturas/anotadas';
const SOLO = process.argv[3];
mkdirSync(OUT, { recursive: true });

// A 1100 px el tablero muestra la barra lateral y las tarjetas quedan angostas:
// los recortes son chicos y se pueden agrandar sin perder nitidez.
const ESCRITORIO = { width: 1100, height: 900 };
const ANGOSTO = { width: 560, height: 900 };
const CELULAR = { width: 390, height: 844 };

const kpi = (nombre) => ({ s: `article:has(h3:text-is("${nombre}"))` });
const tarjeta = (titulo) => ({ s: `section:has(h2:text-is("${titulo}"))` });
const segmento = (nombre) => ({ s: `button[aria-pressed]:has-text("${nombre}")` });
const preguntar = (pregunta, espera) => async (page) => {
  await page.getByRole('button', { name: pregunta }).click();
  await page.getByText(espera).first().waitFor();
};

// zona: elementos que tiene que abarcar el recorte (+ margen); `ancho` lo limita desde la izquierda.
// notas: s = selector | t = texto (parcial salvo `exacto`); n = índice (-1 = último);
// en = punto de la flecha (derecha por defecto, 'arriba', 'abajo', 'centro' o 'izquierda'); alerta = para mejorar.
const CAPTURAS = [
  // 1. Producto
  {
    nombre: 'p01-valor-en-riesgo', ruta: '/clientes',
    zona: [segmento('No se pueden perder')], margen: 16,
    notas: [
      { t: '6,9%', label: 'Estos clientes facturaron el 6,9 % de todo el dinero…' },
      { t: '252 clientes', label: '…son 252 que compraban mucho y dejaron de venir' },
      { t: 'Contacto directo del equipo', en: 'abajo', label: 'Y la tarjeta dice qué hacer: llamarlos esta semana' },
    ],
  },
  {
    nombre: 'p02-asistente', ruta: '/asistente', viewport: ANGOSTO,
    accion: preguntar('¿Qué segmento conviene reactivar?', /Conviene empezar por/),
    zona: [{ s: 'ol[role=log]' }], margen: 4,
    notas: [
      { s: 'ol[role=log] li', n: 0, label: 'Se pregunta como se le preguntaría a un compañero, sin saber SQL' },
      { t: 'Conviene empezar por', label: 'Responde con un nombre, un monto y una acción' },
      { t: 'Cómo lo calculé', label: 'Y muestra de dónde salió: la desconfianza en los números fue lo que más se repitió en las entrevistas' },
    ],
  },

  // 2. Diseño
  {
    nombre: 'd01-kpis', ruta: '/',
    zona: [kpi('Ingresos')], margen: 14,
    notas: [
      { ...kpi('Ingresos'), en: 'arriba', label: 'Ingresos va destacado: es lo primero que mira la dirección' },
      { t: '1,3%', en: 'abajo', label: 'Flecha, signo y color: aunque no distingas el rojo del verde, se entiende' },
      { t: 'vs. dic 2009', n: 0, label: 'Siempre dice contra qué compara' },
    ],
  },
  {
    nombre: 'd02-kpis-honestos', ruta: '/',
    zona: [kpi('Clientes nuevos'), kpi('Devoluciones por pedido')], margen: 14,
    notas: [
      { t: 'Sin comparación', label: 'Acá la comparación daba −62 %, pero era un efecto del dataset: prefiero explicarlo a mostrar un número engañoso' },
      { ...kpi('Tasa de recompra'), alerta: true, label: 'Falta «vuelven al mes siguiente»: en el test, dos personas lo buscaron acá' },
      { t: '14,7%', en: 'abajo', label: 'Las devoluciones bajaron: va en verde aunque la flecha apunte abajo' },
    ],
  },
  {
    nombre: 'd03-segmento-filtro', ruta: '/clientes',
    accion: (page) => page.getByRole('button', { name: /^En riesgo/ }).click(),
    zona: [segmento('En riesgo')], margen: 16,
    notas: [
      { s: 'button[aria-pressed=true]', en: 'arriba', label: 'Tocada, la tarjeta cambia de fondo y borde: queda claro qué está filtrado' },
      { s: 'button[aria-pressed=true] span:has-text("ingresos")', label: 'La etiqueta dice en texto cuánto pesa en el dinero' },
      { s: 'button[aria-pressed=true] > span[aria-hidden=true]', label: 'Y la barra lo muestra: el color nunca va solo' },
    ],
  },
  {
    nombre: 'd04-tabla-filtrada', ruta: '/clientes',
    accion: (page) => page.getByRole('button', { name: /^En riesgo/ }).click(),
    zona: [{ t: 'Clientes · En riesgo' }, { s: 'table tbody tr', n: 2 }], margen: 18, ancho: 560,
    notas: [
      { t: 'Clientes · En riesgo', label: 'El título repite el filtro: en el test, una persona no se había dado cuenta de que la tarjeta filtraba' },
      { s: 'input[type=search]', label: 'Se busca por número de cliente o por país' },
    ],
  },
  {
    nombre: 'd05-mapa-calor', ruta: '/retencion',
    zona: [{ t: 'Cohorte', exacto: true }, { t: 'Mes 5', exacto: true }, { s: 'p:has-text("Menos") > span' }], margen: 6,
    notas: [
      { t: '27,8 %', exacto: true, label: 'Cada celda escribe su número: el color sólo refuerza' },
      { t: '100 %', exacto: true, n: -1, label: 'El mes 0 siempre es 100 % y va en el tono más fuerte: ancla la escala' },
      { s: 'p:has-text("Menos") > span', en: 'abajo', label: 'Cinco tonos sólidos, cada uno con su color de texto: el peor contraste queda en 5,5:1' },
    ],
  },
  {
    nombre: 'd06-oscuro', ruta: '/', tema: 'oscuro',
    zona: [kpi('Ingresos')], margen: 14,
    notas: [
      { ...kpi('Ingresos'), en: 'arriba', label: 'Mismos componentes: sólo cambia la capa de tokens' },
      { t: '1,3%', en: 'abajo', label: 'El rojo y el verde se aclaran en oscuro para mantener el contraste' },
      { t: 'vs. dic 2009', n: 0, label: 'El tema guardado lo pinta el servidor: no hay parpadeo de claro a oscuro' },
    ],
  },
  {
    nombre: 'd07-celular-tabla', ruta: '/clientes', viewport: CELULAR,
    zona: [{ s: 'table tbody tr', n: 0 }, { s: 'table tbody tr', n: 1 }], margen: 14,
    notas: [
      { s: 'table tbody tr', n: 0, en: 'arriba', label: 'En el teléfono, cada fila pasa a ser una tarjeta' },
      { s: 'table tbody tr td', n: 1, label: 'Etiqueta a la izquierda, valor a la derecha: nada de deslizar de costado' },
      { s: 'table tbody td span', n: 0, label: 'El segmento sigue siendo una etiqueta legible' },
    ],
  },
  {
    nombre: 'd08-celular-filtros', ruta: '/', viewport: CELULAR,
    zona: [{ t: 'Tema y densidad' }, { s: 'article', n: 0 }], margen: 14,
    notas: [
      { t: 'Tema y densidad', label: 'Tema y densidad quedan plegados: se tocan una vez y no empujan los números' },
      { s: '[role=radiogroup]:has-text("3 meses")', label: 'El período entra en el ancho del teléfono' },
      { s: 'article', n: 0, en: 'abajo', label: 'El primer número aparece sin hacer scroll' },
    ],
  },

  // 3. Full-Stack
  {
    nombre: 'f01-filtros-url', ruta: '/',
    accion: async (page) => {
      await page.getByRole('radio', { name: '3 meses' }).click();
      await page.waitForURL(/periodo=ULTIMOS_3_MESES/);
    },
    zona: [{ s: '[role=radiogroup]:has-text("3 meses")' }, { t: 'Período', exacto: true }], margen: 8,
    notas: [
      { t: 'Período', exacto: true, label: 'Los filtros viven en un store de Zustand, uno por request, sincronizado con la URL' },
      { s: '[role=radiogroup]:has-text("3 meses")', label: 'Elegir el período cambia la URL: el link se comparte y el servidor lo devuelve ya armado' },
    ],
  },
  {
    nombre: 'f02-asistente-consulta', ruta: '/asistente?region=REINO_UNIDO', viewport: ANGOSTO,
    accion: async (page) => {
      await preguntar('¿Cuánto facturamos?', /se facturaron/)(page);
      await page.getByText('Cómo lo calculé').click();
    },
    zona: [{ s: 'ol[role=log] li', n: -1 }], margen: 4,
    notas: [
      { t: 'en el Reino Unido', label: 'Respeta el filtro de región que está activo en la URL' },
      { s: 'ol[role=log] code', label: 'La consulta GraphQL que respondió: la misma que usa el tablero' },
    ],
  },
  {
    nombre: 'f03-storybook-a11y', url: `${STORYBOOK}/?path=/story/datos-tabladatos--con-paginacion&globals=tema:oscuro&addonPanel=storybook/a11y/panel`,
    viewport: { width: 1000, height: 760 }, espera: 3500,
    clip: { x: 230, y: 0, width: 560, height: 760 },
    notas: [
      { s: 'button:has-text("Oscuro")', en: 'abajo', label: 'Tema y densidad se cambian desde la barra, en cualquier componente' },
      { s: 'button:has-text("Accessibility")', label: 'axe revisa cada historia; en CI una violación frena el build' },
      { t: 'No accessibility violations found', label: '0 violaciones en la tabla, también en modo oscuro' },
    ],
  },

  // 4. Datos
  {
    nombre: 'da01-pareto', ruta: '/',
    zona: [tarjeta('Concentración de ingresos')], margen: 14,
    notas: [
      { t: '76,95 %', en: 'arriba', label: 'El 20 % de los clientes genera el 77 % de los ingresos' },
      { s: '.recharts-reference-line', n: 0, en: 'centro', label: 'La línea punteada marca ese 20 %' },
      { s: '.recharts-line-curve', en: 'centro', label: 'Cuanto más rápido sube la curva, más depende el negocio de pocos clientes' },
    ],
  },
  {
    nombre: 'da02-cohortes', ruta: '/retencion',
    zona: [{ t: 'Cohorte', exacto: true }, { t: 'Mes 4', exacto: true }, { t: 'oct 2011', exacto: true }], margen: 6,
    notas: [
      { t: '11,8 %', exacto: true, n: 0, label: 'Quien entró en la Navidad de 2010 casi no volvió: entre 3 % y 12 % por mes' },
      { t: '34,7 %', exacto: true, label: 'Los que entraron a mitad de año vuelven bastante más: hasta 34,7 % al cuarto mes' },
      { t: '37,8 %', exacto: true, label: 'Los de septiembre de 2011 volvieron en noviembre a reponer para las fiestas' },
    ],
  },
  {
    nombre: 'da03-campeones', ruta: '/clientes',
    zona: [segmento('Campeones')], margen: 16,
    notas: [
      { t: '54,4%', label: 'Generan más de la mitad del dinero…' },
      { t: '742 clientes', label: '…y son sólo 742, el 12,7 % de la base' },
      { t: 'Darles acceso anticipado', en: 'abajo', label: 'Con ellos la acción es cuidarlos: acceso anticipado y referidos, no descuentos' },
    ],
  },
];

function locator(page, nota) {
  const loc = nota.s ? page.locator(nota.s) : page.getByText(nota.t, { exact: Boolean(nota.exacto) });
  return nota.n === -1 ? loc.last() : loc.nth(nota.n ?? 0);
}

async function rect(page, nota) {
  const handle = await locator(page, nota).elementHandle({ timeout: 4000 }).catch(() => null);
  if (!handle) return null;
  return handle.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
  });
}

const ANCHO_IMAGEN = 620;
const ANCHO_ETIQUETA = 360;

async function componer(browser, png, clip, notas, file) {
  const k = Math.min(1.6, ANCHO_IMAGEN / clip.width);
  const pad = 40;
  const imgW = clip.width * k;
  const imgH = clip.height * k;
  const lx = pad + imgW + 70;
  const W = Math.ceil(lx + ANCHO_ETIQUETA + pad);
  const pts = notas.map((n) => {
    const cx = n.x - clip.x;
    const cy = n.y - clip.y;
    let tx = cx + n.w + 8;
    let ty = cy + n.h / 2;
    if (n.en === 'arriba') [tx, ty] = [cx + n.w / 2, cy - 8];
    if (n.en === 'abajo') [tx, ty] = [cx + n.w / 2, cy + n.h + 8];
    if (n.en === 'centro') [tx, ty] = [cx + n.w / 2, cy + n.h / 2];
    tx = pad + Math.max(4, Math.min(clip.width - 4, tx)) * k;
    ty = pad + Math.max(4, Math.min(clip.height - 4, ty)) * k;
    return { label: n.label, color: n.alerta ? '#F59E0B' : '#0EA5E9', tx, ty };
  });
  // Numeradas de arriba hacia abajo, en el orden en que se leen.
  pts.sort((a, b) => a.ty - b.ty).forEach((p, i) => (p.i = i + 1));
  console.log(pts.map((p) => `    ${p.i}. ${p.label}`).join('\n'));
  const page = await browser.newPage({ viewport: { width: W, height: 400 }, deviceScaleFactor: 2 });
  await page.setContent(`<!doctype html><html><head><style>
    body{margin:0;width:${W}px;background:linear-gradient(135deg,#F0FDFA,#E0F2FE);font-family:Inter,system-ui,sans-serif;position:relative}
    img{position:absolute;left:${pad}px;top:${pad}px;width:${imgW}px;border-radius:18px;box-shadow:0 20px 50px rgba(15,118,110,.25),0 0 0 1px rgba(14,165,233,.25)}
    .tag{position:absolute;left:${lx}px;width:${ANCHO_ETIQUETA}px;box-sizing:border-box;display:flex;align-items:flex-start;gap:12px;padding:14px 18px;border-radius:20px;color:#fff;font-weight:600;font-size:22px;line-height:1.3;box-shadow:0 8px 20px rgba(15,23,42,.18)}
    .n{flex:none;width:32px;height:32px;border-radius:50%;background:#fff;display:grid;place-items:center;font-size:18px;font-weight:800}
    svg{position:absolute;left:0;top:0;overflow:visible}
  </style></head><body>
    <img src="data:image/png;base64,${png.toString('base64')}" />
    ${pts.map((p) => `<div class="tag" style="background:${p.color}"><span class="n" style="color:${p.color}">${p.i}</span><span>${p.label}</span></div>`).join('')}
    <svg id="flechas"></svg>
  </body></html>`);
  // Etiquetas apiladas a la altura de su punto, sin superponerse (con su alto real).
  await page.evaluate(({ pts, pad, imgH, lx }) => {
    const tags = [...document.querySelectorAll('.tag')];
    const orden = pts.map((p, i) => ({ ...p, el: tags[i] })).sort((a, b) => a.ty - b.ty);
    let piso = pad;
    for (const p of orden) {
      const h = p.el.offsetHeight;
      p.top = Math.max(piso, p.ty - h / 2);
      p.el.style.top = `${p.top}px`;
      p.sy = p.top + Math.min(h / 2, 30);
      piso = p.top + h + 16;
    }
    const H = Math.ceil(Math.max(pad * 2 + imgH, piso + pad - 16));
    document.body.style.height = `${H}px`;
    const svg = document.getElementById('flechas');
    svg.setAttribute('width', document.body.offsetWidth);
    svg.setAttribute('height', H);
    svg.innerHTML = orden
      .map((p) => {
        const sx = lx - 4;
        const mx = (sx + p.tx) / 2;
        return `<path d="M${sx},${p.sy} C${mx},${p.sy} ${mx},${p.ty} ${p.tx},${p.ty}" stroke="${p.color}" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="${p.tx}" cy="${p.ty}" r="9" fill="${p.color}" stroke="#fff" stroke-width="3"/>`;
      })
      .join('');
  }, { pts, pad, imgH, lx });
  const alto = await page.evaluate(() => document.body.offsetHeight);
  await page.setViewportSize({ width: W, height: alto });
  await page.screenshot({ path: file });
  await page.close();
}

const browser = await chromium.launch();
for (const cap of CAPTURAS) {
  if (SOLO && cap.nombre !== SOLO) continue;
  const ctx = await browser.newContext({ viewport: cap.viewport ?? ESCRITORIO, deviceScaleFactor: 2, locale: 'es-AR' });
  await ctx.addCookies([{ name: 'pulso-preferencias', value: `${cap.tema ?? 'claro'}%7Ccomoda`, url: BASE }]);
  const page = await ctx.newPage();
  await page.goto(cap.url ?? BASE + cap.ruta, { waitUntil: 'networkidle' });
  await page.waitForTimeout(cap.espera ?? 800);
  if (cap.accion) {
    await cap.accion(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(700);
  }
  await page.evaluate(() => scrollTo(0, 0));
  let clip = cap.clip;
  if (cap.zona) {
    const rs = [];
    for (const z of cap.zona) {
      const r = await rect(page, z);
      if (!r) throw new Error(`${cap.nombre}: no encontré la zona ${z.s ?? z.t}`);
      rs.push(r);
    }
    const m = cap.margen ?? 16;
    const x = Math.min(...rs.map((r) => r.x)) - m;
    const y = Math.min(...rs.map((r) => r.y)) - m;
    const x2 = Math.max(...rs.map((r) => r.x + r.w)) + m;
    const y2 = Math.max(...rs.map((r) => r.y + r.h)) + m;
    clip = { x: Math.max(0, x), y: Math.max(0, y), width: Math.min(cap.ancho ?? Infinity, x2 - x), height: Math.min(cap.alto ?? Infinity, y2 - y) };
  }
  clip = { x: Math.round(clip.x), y: Math.round(clip.y), width: Math.round(clip.width), height: Math.round(clip.height) };
  const notas = [];
  for (const n of cap.notas) {
    const r = await rect(page, n);
    if (r) notas.push({ ...n, ...r });
    else console.warn('  sin elemento:', cap.nombre, n.label);
  }
  const png = await page.screenshot({ clip, fullPage: true });
  await componer(browser, png, clip, notas, join(OUT, `${cap.nombre}.png`));
  console.log('ok', cap.nombre, `${notas.length}/${cap.notas.length}`, `${clip.width}×${clip.height}`);
  await ctx.close();
}
await browser.close();
