const { test, expect } = require('@playwright/test');

const painting = '#gallery .slide.is-visible img';
const first = /64818\.jpg$/;
const second = /24645\.jpg$/;

test('browser gallery loads offline from bundled files and responds to the keyboard', async ({ page }) => {
  const external = [];
  page.on('request', request => {
    if (!request.url().startsWith('http://127.0.0.1:4173/')) external.push(request.url());
  });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto('/');
  await expect(page.locator(painting)).toHaveAttribute('src', first);
  await expect(page.locator('#title')).toHaveText('Stacks of Wheat (End of Summer)');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(painting)).toHaveAttribute('src', second);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator(painting)).toHaveAttribute('src', first);
  await page.keyboard.press('Enter');
  await expect(page.locator('#caption')).toHaveAttribute('aria-hidden', 'false');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Start gallery' })).toBeVisible();
  await page.getByRole('button', { name: 'Start gallery' }).click();
  await expect(page.locator(painting)).toHaveAttribute('src', first);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('art slideshow advances automatically and honors reduced motion', async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator(painting)).toHaveAttribute('src', first);
  await expect(page.locator(painting)).toHaveCSS('animation-name', 'none');
  await page.clock.runFor(7000);
  await expect(page.locator('#caption')).toHaveAttribute('aria-hidden', 'true');
  await page.clock.runFor(6500);
  await expect(page.locator(painting)).toHaveAttribute('src', second);
});

async function mockTV(page) {
  await page.addInitScript(() => {
    window.tvEvents = [];
    window.tizen = { application: { getCurrentApplication: () => ({ exit: () => window.tvEvents.push('exit') }) } };
  });
  await page.route('**/$WEBAPIS/webapis/webapis.js', route => route.fulfill({
    contentType: 'text/javascript',
    body: 'window.webapis = {appcommon: {AppCommonScreenSaverState: {SCREEN_SAVER_ON: 1, SCREEN_SAVER_OFF: 0}, setScreenSaver: (state) => window.tvEvents.push(state)}};'
  }));
}

test('Samsung protection is re-enabled when hidden and before remote Back exits', async ({ page }) => {
  await mockTV(page);
  await page.goto('/');
  await expect(page.locator(painting)).toHaveAttribute('src', first);
  await expect.poll(() => page.evaluate(() => window.tvEvents)).toEqual([0]);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => page.evaluate(() => window.tvEvents)).toEqual([0, 1]);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator(painting)).toHaveAttribute('src', second);
  await expect.poll(() => page.evaluate(() => window.tvEvents)).toEqual([0, 1, 0]);
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.tvEvents)).toEqual([0, 1, 0, 1, 'exit']);
});

test('broken images do not suppress Samsung protection or block the next artwork', async ({ page }) => {
  await mockTV(page);
  await page.route('**/assets/art/64818.jpg', route => route.abort());
  await page.goto('/');
  await expect(page.locator(painting)).toHaveAttribute('src', second);
  await expect.poll(() => page.evaluate(() => window.tvEvents)).toEqual([0]);
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await expect.poll(() => page.evaluate(() => window.tvEvents)).toEqual([0, 1]);
});
