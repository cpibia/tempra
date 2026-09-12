import { test, expect } from '@playwright/test';

/**
 * Verifica che la promessa principale sia mantenuta: dopo la prima visita
 * l'applicazione si apre e funziona senza rete.
 */

test('il manifest e installabile', async ({ page }) => {
  await page.goto('/');
  const response = await page.request.get('/manifest.webmanifest');
  expect(response.ok()).toBe(true);

  const manifest = await response.json();
  expect(manifest.name).toBeTruthy();
  expect(manifest.start_url).toBe('/');
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
  expect(manifest.lang).toBe('it');

  for (const icon of manifest.icons) {
    const asset = await page.request.get(icon.src);
    expect(asset.ok(), `icona mancante: ${icon.src}`).toBe(true);
  }
});

test('il service worker si registra e mette in cache il guscio', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(
    () => navigator.serviceWorker.controller !== null
      || navigator.serviceWorker.getRegistration().then(Boolean),
    undefined,
    { timeout: 15_000 },
  );

  const registered = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return Boolean(registration.active);
  });
  expect(registered).toBe(true);

  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    let total = 0;
    for (const name of names) {
      total += (await (await caches.open(name)).keys()).length;
    }
    return { names, total };
  });
  expect(cached.total).toBeGreaterThan(10);
});

test('l applicazione si apre senza rete', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  // Si visita il catalogo per portarlo in cache prima di staccare la rete.
  await page.goto('/esercizi');
  await expect(page.getByRole('heading', { name: 'Esercizi' })).toBeVisible();
  await page.waitForLoadState('networkidle');

  await context.setOffline(true);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Esercizi' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: /Cerca fra gli esercizi/ })).toBeVisible();

  // Il catalogo e' nel pacchetto: la ricerca deve funzionare comunque.
  await page.getByRole('searchbox', { name: /Cerca fra gli esercizi/ }).fill('squat');
  await expect(page.getByRole('status')).toContainText('esercizi');

  await context.setOffline(false);
});

test('le risposte dell API non finiscono mai in cache', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);

  const apiEntries = await page.evaluate(async () => {
    const names = await caches.keys();
    const found: string[] = [];
    for (const name of names) {
      for (const request of await (await caches.open(name)).keys()) {
        if (request.url.includes('/api/')) found.push(request.url);
      }
    }
    return found;
  });

  expect(apiEntries).toEqual([]);
});
