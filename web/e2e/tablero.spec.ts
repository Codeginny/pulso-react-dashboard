import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGINAS = [
  { ruta: '/', titulo: 'Resumen' },
  { ruta: '/clientes', titulo: 'Clientes' },
  { ruta: '/retencion', titulo: 'Retención' },
  { ruta: '/productos', titulo: 'Productos y países' },
  { ruta: '/asistente', titulo: 'Asistente de datos' },
];

test.describe('SSR', () => {
  test('el HTML llega del servidor con los datos, sin esperar JavaScript', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toContain('Clientes activos');
    expect(html).toMatch(/£\s?8\.225\.000/);
    expect(html).toContain('window.__PULSO__');
  });

  test('los filtros de la URL se aplican en el servidor', async ({ request }) => {
    const html = await (await request.get('/?periodo=ULTIMOS_3_MESES&region=REINO_UNIDO')).text();
    expect(html).toMatch(/£\s?2\.569\.083/);
  });

  test('una ruta inexistente responde 404', async ({ request }) => {
    expect((await request.get('/no-existe')).status()).toBe(404);
  });

  test('el tema guardado se pinta desde el servidor, sin parpadeo', async ({ page, context }) => {
    await context.addCookies([{ name: 'pulso-preferencias', value: 'oscuro%7Ccompacta', url: 'http://localhost:5200' }]);
    const respuesta = await page.goto('/');
    expect(await respuesta!.text()).toContain('data-tema="oscuro"');
  });
});

test.describe('Navegación y filtros', () => {
  test('cambiar el período actualiza los KPIs y la URL', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/£\s?8\.225\.000/)).toBeVisible();
    await page.getByRole('radio', { name: '3 meses' }).click();
    await expect(page).toHaveURL(/periodo=ULTIMOS_3_MESES/);
    await expect(page.getByText(/£\s?3\.077\.613/)).toBeVisible();
  });

  test('los filtros se conservan al cambiar de sección', async ({ page }) => {
    await page.goto('/?region=INTERNACIONAL');
    await page.getByRole('link', { name: 'Productos y países' }).click();
    await expect(page).toHaveURL(/\/productos\?region=INTERNACIONAL/);
    await expect(page.getByRole('heading', { level: 1, name: 'Productos y países' })).toBeFocused();
  });

  test('elegir un segmento filtra la tabla de clientes', async ({ page }) => {
    await page.goto('/clientes');
    await page.getByRole('button', { name: /^En riesgo/ }).click();
    await expect(page.getByRole('heading', { name: 'Clientes · En riesgo' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Clientes' }).getByText('En riesgo').first()).toBeVisible();
  });

  test('el enlace "Saltar al contenido" es lo primero del orden de tabulación', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Sin teclado en celular');
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  });
});

test.describe('Asistente', () => {
  test('responde una pregunta sugerida con datos y la consulta usada', async ({ page }) => {
    await page.goto('/asistente');
    await page.getByRole('button', { name: '¿Cuánto facturamos?' }).click();
    const log = page.getByRole('log', { name: 'Conversación' });
    await expect(log.getByText(/se facturaron/)).toBeVisible();
    await log.getByText('Cómo lo calculé').click();
    await expect(log.getByText(/resumen\(filtros/)).toBeVisible();
  });
});

test.describe('Accesibilidad (axe, WCAG 2.2 AA)', () => {
  for (const tema of ['claro', 'oscuro'] as const) {
    for (const { ruta, titulo } of PAGINAS) {
      test(`${titulo} en tema ${tema} no tiene violaciones`, async ({ page, context }) => {
        await context.addCookies([{ name: 'pulso-preferencias', value: `${tema}%7Ccomoda`, url: 'http://localhost:5200' }]);
        await page.goto(ruta);
        await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
        await page.waitForLoadState('networkidle');
        const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
      });
    }
  }

  test('no hay desplazamiento horizontal en celular', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Sólo celular');
    for (const { ruta } of PAGINAS) {
      await page.goto(ruta);
      const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(desborde, ruta).toBeLessThanOrEqual(0);
    }
  });
});
