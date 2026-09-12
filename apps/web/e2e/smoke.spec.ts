import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Percorso completo dell'utente, dal primo avvio al riepilogo di fine allenamento.
 * Serve a verificare che la catena onboarding, generazione, sessione e record
 * regga davvero in un browser, non solo nei tipi.
 */

async function completeOnboarding(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Come funziona' })).toBeVisible();

  await page.getByRole('button', { name: 'Avanti' }).click();
  await page.getByRole('radio', { name: /Massa muscolare/ }).check();

  await page.getByRole('button', { name: 'Avanti' }).click();
  await page.getByRole('radio', { name: /Palestra attrezzata/ }).check();

  await page.getByRole('button', { name: 'Avanti' }).click();
  await page.getByRole('radio', { name: '4 giorni' }).check();
  await page.getByRole('radio', { name: '60 min' }).check();

  await page.getByRole('button', { name: 'Avanti' }).click();
  await page.getByRole('radio', { name: /Intermedio/ }).check();

  await page.getByRole('button', { name: 'Avanti' }).click(); // dati corporei
  await page.getByRole('button', { name: 'Avanti' }).click(); // salute
  await page.getByRole('button', { name: 'Avanti' }).click(); // riepilogo
}

test('crea una scheda dall onboarding e la mostra', async ({ page }) => {
  await completeOnboarding(page);
  await expect(page.getByText('Massa muscolare')).toBeVisible();

  await page.getByRole('button', { name: 'Crea la mia scheda' }).click();

  await expect(page).toHaveURL(/\/schede\//);
  await expect(page.getByRole('tab')).toHaveCount(4);
  await expect(page.getByRole('button', { name: /Allenati con questo giorno/ })).toBeVisible();
});

/** L'editor si ricompone quando la scheda arriva da IndexedDB: si attende che sia stabile. */
async function startFirstDay(page: Page) {
  await page.getByRole('button', { name: 'Crea la mia scheda' }).click();
  await expect(page).toHaveURL(/\/schede\//);
  await expect(page.getByRole('tab').first()).toBeVisible();
  // L'azione sta in una barra fissa: non va scrollata, si clicca dove e'.
  const start = page.getByRole('button', { name: /Allenati con questo giorno/ });
  await expect(start).toBeVisible();
  await start.click();
  await expect(page).toHaveURL(/\/allenamento/);
}

test('registra una serie, avvia il recupero e chiude l allenamento', async ({ page }) => {
  await completeOnboarding(page);
  await startFirstDay(page);

  const firstCheckbox = page.getByRole('checkbox').first();
  await firstCheckbox.check();
  await expect(firstCheckbox).toBeChecked();

  // Il recupero parte da solo: e' la scelta predefinita.
  await expect(page.getByRole('timer')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Recupero in corso' })).toBeVisible();

  await page.getByRole('button', { name: 'Aggiungi 15 secondi al recupero' }).click();
  await page.getByRole('button', { name: 'Salta', exact: true }).click();
  await expect(page.getByRole('timer')).toHaveCount(0);

  await page.getByRole('button', { name: 'Fine' }).click();
  await page.getByRole('button', { name: 'Termina', exact: true }).click();

  await expect(page).toHaveURL(/riepilogo/);
  await expect(page.getByText('Allenamento completato', { exact: true })).toBeVisible();
  await expect(page.getByText('serie', { exact: true })).toBeVisible();
});

test('il catalogo cerca e apre un esercizio', async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole('button', { name: 'No grazie, la costruisco da solo' }).click();

  await page.getByRole('link', { name: 'Esercizi' }).click();
  await page.getByRole('searchbox', { name: /Cerca fra gli esercizi/ }).fill('panca piana');

  // La lista si aggiorna in differita: si aspetta il risultato atteso, non un indice.
  const target = page.getByRole('link', { name: /Panca piana con bilanciere/ }).first();
  await expect(target).toBeVisible();
  await target.click();
  await expect(page.getByRole('heading', { name: 'Come si esegue' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Scheda tecnica' })).toBeVisible();
});

test('la sessione sopravvive a un ricaricamento della pagina', async ({ page }) => {
  await completeOnboarding(page);
  await startFirstDay(page);

  const weightField = page.locator('.set-row__input').first();
  await weightField.fill('62,5');
  await page.getByRole('checkbox').first().check();

  await page.reload();
  await expect(page.locator('.set-row__input').first()).toHaveValue('62,5');
  await expect(page.getByRole('checkbox').first()).toBeChecked();
});

/**
 * Lo scorrimento orizzontale su mobile e' sempre un difetto, e a schermi stretti
 * viola il criterio 1.4.10 sul reflow. axe non lo rileva, quindi va verificato qui.
 */
test.describe('nessuno scorrimento orizzontale', () => {
  const routes = ['/', '/schede', '/esercizi', '/progressi', '/impostazioni', '/storico'];

  for (const route of routes) {
    test(`la pagina ${route} sta nella larghezza dello schermo`, async ({ page }) => {
      await completeOnboarding(page);
      await page.getByRole('button', { name: 'No grazie, la costruisco da solo' }).click();
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const overflow = await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        // Chi sfora ma sta dentro un contenitore che scorre di suo (la riga
        // dei filtri, una tabella larga) non e' un difetto: e' il pattern voluto.
        const inScroller = (el: Element) => {
          let node: Element | null = el.parentElement;
          while (node && node !== document.body) {
            const overflowX = getComputedStyle(node).overflowX;
            if (overflowX === 'auto' || overflowX === 'scroll') return true;
            node = node.parentElement;
          }
          return false;
        };
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: width,
          colpevoli: [...document.querySelectorAll('body *')]
            .filter((el) => el.getBoundingClientRect().right > width + 1 && !inScroller(el))
            .slice(0, 5)
            .map((el) => `${el.tagName}.${(el as HTMLElement).className}`),
        };
      });

      expect(overflow.colpevoli).toEqual([]);
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
    });
  }

  test('anche la scheda di un esercizio dal nome lungo', async ({ page }) => {
    await completeOnboarding(page);
    await page.getByRole('button', { name: 'No grazie, la costruisco da solo' }).click();
    await page.goto('/esercizi/panca-piana-con-bilanciere-presa-media');
    await expect(page.getByRole('heading', { name: 'Scheda tecnica' })).toBeVisible();
    await page.waitForLoadState('networkidle');

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });
});

test.describe('accessibilita', () => {
  const routes: [string, string][] = [
    ['/', 'home'],
    ['/schede', 'schede'],
    ['/esercizi', 'catalogo'],
    ['/progressi', 'progressi'],
    ['/impostazioni', 'impostazioni'],
  ];

  for (const theme of ['dark', 'light'] as const) {
    for (const [route, name] of routes) {
      test(`${name} non ha violazioni WCAG AA in tema ${theme}`, async ({ page }) => {
        await completeOnboarding(page);
        await page.getByRole('button', { name: 'No grazie, la costruisco da solo' }).click();
        await page.evaluate((t) => {
          localStorage.setItem('tempra.theme', t);
          document.documentElement.dataset.theme = t;
        }, theme);
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} nodi`)).toEqual([]);
      });
    }
  }
});
