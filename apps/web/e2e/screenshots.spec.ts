import { test, type Page } from '@playwright/test';

/**
 * Cattura le schermate usate nella documentazione.
 * Non e' un test di regressione: si esegue a mano con
 * `npx playwright test e2e/screenshots.spec.ts --project=mobile`.
 */

const OUT = '../../docs/screenshots';

async function onboard(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Avanti' }).click();
  await page.getByRole('radio', { name: /Massa muscolare/ }).check();
  await page.getByRole('button', { name: 'Avanti' }).click();
  await page.getByRole('radio', { name: /Palestra attrezzata/ }).check();
  await page.getByRole('button', { name: 'Avanti' }).click();
  await page.getByRole('radio', { name: '4 giorni' }).check();
  await page.getByRole('button', { name: 'Avanti' }).click();
  await page.getByRole('radio', { name: /Intermedio/ }).check();
  await page.getByRole('button', { name: 'Avanti' }).click();
  await page.getByRole('button', { name: 'Avanti' }).click();
  await page.getByRole('button', { name: 'Avanti' }).click();
}

test('cattura le schermate', async ({ page }) => {
  // Onboarding
  await page.goto('/');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/01-onboarding.png` });

  await page.getByRole('button', { name: 'Avanti' }).click();
  await page.getByRole('radio', { name: /Massa muscolare/ }).check();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/02-obiettivo.png` });

  await page.getByRole('button', { name: 'Avanti' }).click();
  await page.getByRole('radio', { name: /Palestra attrezzata/ }).check();
  await page.getByRole('button', { name: 'Avanti' }).click();
  await page.getByRole('radio', { name: '4 giorni' }).check();
  await page.getByRole('button', { name: 'Avanti' }).click();
  await page.getByRole('radio', { name: /Intermedio/ }).check();
  await page.getByRole('button', { name: 'Avanti' }).click();
  await page.getByRole('button', { name: 'Avanti' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/03-salute.png` });

  await page.getByRole('button', { name: 'Avanti' }).click();
  await page.getByRole('button', { name: 'Crea la mia scheda' }).click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/04-scheda.png` });

  // Allenamento in corso
  await page.getByRole('button', { name: /Allenati con questo giorno/ }).click();
  await page.waitForTimeout(900);
  const inputs = page.locator('.set-row__input');
  await inputs.nth(0).fill('60');
  await inputs.nth(1).fill('8');
  await page.getByRole('checkbox').first().check();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/05-allenamento.png` });

  // Catalogo
  await page.goto('/esercizi');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/06-catalogo.png` });

  // Dettaglio esercizio
  await page.getByRole('searchbox', { name: /Cerca fra gli esercizi/ }).fill('panca piana');
  await page.waitForTimeout(600);
  await page.getByRole('link', { name: /Panca piana con bilanciere/ }).first().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/07-esercizio.png`, fullPage: false });

  // Tema chiaro sulla home
  await page.evaluate(() => {
    localStorage.setItem('tempra.theme', 'light');
    document.documentElement.dataset.theme = 'light';
  });
  await page.goto('/');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/08-home-chiaro.png` });
});

test('cattura la home in tema scuro', async ({ page }) => {
  await onboard(page);
  await page.getByRole('button', { name: 'Crea la mia scheda' }).click();
  await page.waitForTimeout(800);
  await page.goto('/');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/00-home.png` });
});
