import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const out = '/opt/cursor/artifacts/screenshots';
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
await page.waitForTimeout(1800);
await page.screenshot({ path: `${out}/bloom-home.png`, fullPage: true });

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
  await page.touchscreen.tap(p.x, p.y);
}

const play = toScreen(360, 480);
await page.mouse.click(play.x, play.y);
await page.waitForTimeout(900);
await page.screenshot({ path: `${out}/bloom-map.png`, fullPage: true });

await tap(360, 140);
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/bloom-game.png`, fullPage: true });

// Drag first tray piece onto board with mouse (Phaser pointer)
const from = toScreen(160, 1110);
const mid = toScreen(360, 700);
const to = toScreen(200, 400);
await page.mouse.move(from.x, from.y);
await page.mouse.down();
await page.waitForTimeout(100);
await page.mouse.move(mid.x, mid.y, { steps: 20 });
await page.waitForTimeout(100);
await page.mouse.move(to.x, to.y, { steps: 20 });
await page.waitForTimeout(200);
await page.screenshot({ path: `${out}/bloom-drag.png`, fullPage: true });
await page.mouse.up();
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/bloom-placed.png`, fullPage: true });

console.log('Wrote screenshots to', out);
await browser.close();
