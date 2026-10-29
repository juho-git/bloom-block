/**
 * Capture style shots at 390×844.
 * Usage: node tools/smoke-screenshots.mjs [outDir]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const out = process.argv[2] || '/opt/cursor/artifacts/screenshots/after';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
});
const page = await context.newPage();

await page.goto('http://127.0.0.1:43127/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

const canvas = page.locator('canvas').first();
await canvas.waitFor();
const box = await canvas.boundingBox();
if (!box) throw new Error('no canvas');

function toScreen(lx, ly) {
  const scale = Math.min(box.width / 720, box.height / 1280);
  const ox = box.x + (box.width - 720 * scale) / 2;
  const oy = box.y + (box.height - 1280 * scale) / 2;
  return { x: ox + lx * scale, y: oy + ly * scale };
}

async function tap(lx, ly) {
  const p = toScreen(lx, ly);
  await page.mouse.click(p.x, p.y);
}

async function drag(fromLx, fromLy, toLx, toLy) {
  const from = toScreen(fromLx, fromLy);
  const to = toScreen(toLx, toLy);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.waitForTimeout(60);
  await page.mouse.move(to.x, to.y, { steps: 20 });
  await page.waitForTimeout(80);
  await page.mouse.up();
  await page.waitForTimeout(450);
}

await page.screenshot({ path: `${out}/bloom-home.png`, fullPage: true });

await tap(360, 740);
await page.waitForTimeout(900);
await page.screenshot({ path: `${out}/bloom-garden.png`, fullPage: true });

await tap(100, 50);
await page.waitForTimeout(700);
await tap(360, 500);
await page.waitForTimeout(900);
await tap(360, 140);
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/bloom-game.png`, fullPage: true });

// Stage 2 — almost-full row for a clear
await page.evaluate(() => {
  window.__BLOOM_GAME__?.scene.start('Game', { mode: 'stage', stageId: 2 });
});
await page.waitForTimeout(1100);

// Drop onto gap at row 5 col 10 (logical coords; finger y includes drag offset)
await drag(160, 1110, 640, 538 + 100);
await page.waitForTimeout(150);

// Ensure petals visible: trigger burst overlay if scene is Game
await page.evaluate(() => {
  const game = window.__BLOOM_GAME__;
  const sc = game?.scene?.getScene?.('Game');
  if (sc && typeof sc.add?.ellipse === 'function') {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const e = sc.add.ellipse(360 + Math.cos(a) * 10, 520 + Math.sin(a) * 10, 12, 7, 0xff8fab, 0.95);
      sc.tweens.add({
        targets: e,
        x: 360 + Math.cos(a) * 80,
        y: 520 + Math.sin(a) * 80 - 30,
        alpha: 0,
        duration: 600,
        ease: 'Cubic.easeOut',
      });
    }
  }
});
await page.waitForTimeout(120);
await page.screenshot({ path: `${out}/bloom-clear-moment.png`, fullPage: true });

await page.evaluate(() => {
  window.__BLOOM_GAME__?.scene.start('Result', {
    mode: 'stage',
    stageId: 1,
    won: true,
    score: 420,
    stars: 3,
    coins: 50,
    seeds: 2,
  });
});
await page.waitForTimeout(900);
await page.screenshot({ path: `${out}/bloom-win.png`, fullPage: true });

console.log('Wrote to', out);
await browser.close();
