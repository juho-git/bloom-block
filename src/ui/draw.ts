import Phaser from 'phaser';
import {
  BLOCK_COLORS,
  BLOCK_HILITES,
  BLOCK_PATTERNS,
  BLOCK_RIMS,
  COLORS,
  type BlockPattern,
} from '../config/layout';
import { LOGICAL_H, LOGICAL_W } from '../config/layout';
import { UI } from './theme';

/** Soft vertical cream → blush wash */
export function paintGardenBackdrop(scene: Phaser.Scene, depth = -10): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(depth);
  const steps = 12;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const r = Math.floor(Phaser.Math.Linear(0xff, 0xff, t));
    const gr = Math.floor(Phaser.Math.Linear(0xf4, 0xe0, t));
    const b = Math.floor(Phaser.Math.Linear(0xf0, 0xe8, t));
    const color = (r << 16) | (gr << 8) | b;
    g.fillStyle(color, 1);
    g.fillRect(0, (LOGICAL_H / steps) * i, LOGICAL_W, LOGICAL_H / steps + 2);
  }
  // floating soft orbs
  const orbs = [
    { x: 80, y: 160, r: 70, c: COLORS.blush, a: 0.18 },
    { x: 620, y: 220, r: 90, c: COLORS.lavender, a: 0.16 },
    { x: 120, y: 980, r: 80, c: COLORS.mint, a: 0.14 },
    { x: 580, y: 1100, r: 70, c: COLORS.peach, a: 0.16 },
    { x: 360, y: 70, r: 50, c: COLORS.butter, a: 0.12 },
  ];
  for (const o of orbs) {
    g.fillStyle(o.c, o.a);
    g.fillCircle(o.x, o.y, o.r);
  }
  return g;
}

/** Soft panel with shadow */
export function drawSoftPanel(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 24,
  fill = UI.panel,
): void {
  g.fillStyle(UI.shadow, 0.22);
  g.fillRoundedRect(x + 4, y + 6, w, h, radius);
  g.fillStyle(fill, 1);
  g.fillRoundedRect(x, y, w, h, radius);
  g.lineStyle(3, UI.panelStroke, 0.9);
  g.strokeRoundedRect(x, y, w, h, radius);
}

/** Draw a jelly-like block cell into graphics (top-left at x,y) */
export function drawJellyBlock(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  colorIndex: number,
  alpha = 1,
): void {
  const idx = Phaser.Math.Clamp(colorIndex - 1, 0, 4);
  const fill = BLOCK_COLORS[idx]!;
  const rim = BLOCK_RIMS[idx]!;
  const hi = BLOCK_HILITES[idx]!;
  const pad = Math.max(2, size * 0.08);
  const r = Math.max(8, size * 0.28);
  const bx = x + pad;
  const by = y + pad;
  const bw = size - pad * 2;
  const bh = size - pad * 2;

  // soft drop shadow
  g.fillStyle(0x000000, 0.1 * alpha);
  g.fillRoundedRect(bx + 2, by + 3, bw, bh, r);

  // body
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(bx, by, bw, bh, r);

  // rim
  g.lineStyle(Math.max(2, size * 0.06), rim, 0.55 * alpha);
  g.strokeRoundedRect(bx, by, bw, bh, r);

  // glossy highlight
  g.fillStyle(hi, 0.55 * alpha);
  g.fillRoundedRect(bx + bw * 0.12, by + bh * 0.1, bw * 0.55, bh * 0.28, r * 0.6);

  // pattern glyph (colorblind cue)
  drawBlockPattern(g, bx + bw / 2, by + bh / 2, size * 0.18, BLOCK_PATTERNS[idx]!, rim, alpha);
}

function drawBlockPattern(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  s: number,
  pattern: BlockPattern,
  color: number,
  alpha: number,
): void {
  g.fillStyle(0xffffff, 0.75 * alpha);
  g.lineStyle(Math.max(1.5, s * 0.25), 0xffffff, 0.9 * alpha);
  switch (pattern) {
    case 'heart': {
      // simple heart from circles + triangle-ish
      g.fillCircle(cx - s * 0.35, cy - s * 0.15, s * 0.45);
      g.fillCircle(cx + s * 0.35, cy - s * 0.15, s * 0.45);
      g.fillTriangle(cx - s * 0.75, cy, cx + s * 0.75, cy, cx, cy + s * 0.9);
      break;
    }
    case 'stripe': {
      for (let i = -1; i <= 1; i++) {
        g.lineStyle(Math.max(2, s * 0.28), 0xffffff, 0.85 * alpha);
        g.lineBetween(cx - s + i * s * 0.15, cy + s, cx + s + i * s * 0.15, cy - s);
      }
      break;
    }
    case 'dot': {
      g.fillCircle(cx, cy, s * 0.35);
      g.fillCircle(cx - s * 0.7, cy - s * 0.55, s * 0.22);
      g.fillCircle(cx + s * 0.7, cy - s * 0.55, s * 0.22);
      g.fillCircle(cx - s * 0.7, cy + s * 0.55, s * 0.22);
      g.fillCircle(cx + s * 0.7, cy + s * 0.55, s * 0.22);
      break;
    }
    case 'ring': {
      g.lineStyle(Math.max(2, s * 0.32), 0xffffff, 0.9 * alpha);
      g.strokeCircle(cx, cy, s * 0.7);
      g.fillStyle(0xffffff, 0.85 * alpha);
      g.fillCircle(cx, cy, s * 0.22);
      break;
    }
    case 'petal': {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        g.fillCircle(cx + Math.cos(a) * s * 0.55, cy + Math.sin(a) * s * 0.55, s * 0.38);
      }
      g.fillStyle(COLORS.butter, 0.95 * alpha);
      g.fillCircle(cx, cy, s * 0.28);
      break;
    }
  }
  void color;
}

/** Soil seed cell with sprouting look */
export function drawSeedCell(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
): void {
  const pad = size * 0.1;
  g.fillStyle(0x000000, 0.08);
  g.fillRoundedRect(x + pad + 2, y + pad + 3, size - pad * 2, size - pad * 2, 10);
  g.fillStyle(COLORS.soil, 1);
  g.fillRoundedRect(x + pad, y + pad, size - pad * 2, size - pad * 2, 10);
  // seed
  g.fillStyle(COLORS.butter, 1);
  g.fillEllipse(x + size / 2, y + size / 2 + 4, size * 0.28, size * 0.36);
  // tiny sprout
  g.lineStyle(3, COLORS.leaf, 1);
  g.lineBetween(x + size / 2, y + size / 2 - 2, x + size / 2, y + size * 0.28);
  g.fillStyle(COLORS.leaf, 1);
  g.fillEllipse(x + size / 2 - 6, y + size * 0.3, 8, 5);
  g.fillEllipse(x + size / 2 + 6, y + size * 0.28, 8, 5);
}

/** Cute flower mascot (code-drawn) */
export function drawBloomMascot(
  scene: Phaser.Scene,
  x: number,
  y: number,
  scale = 1,
): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  const petal = COLORS.blush;
  const center = COLORS.butter;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.fillStyle(petal, 1);
    g.fillEllipse(Math.cos(a) * 28, Math.sin(a) * 28, 26, 18);
  }
  g.fillStyle(center, 1);
  g.fillCircle(0, 0, 18);
  // cute face
  g.fillStyle(0x5a4450, 1);
  g.fillCircle(-6, -2, 2.5);
  g.fillCircle(6, -2, 2.5);
  g.lineStyle(2, 0x5a4450, 1);
  g.beginPath();
  g.arc(0, 4, 5, 0.15 * Math.PI, 0.85 * Math.PI, false);
  g.strokePath();
  // cheeks
  g.fillStyle(0xffb3c1, 0.7);
  g.fillCircle(-11, 5, 4);
  g.fillCircle(11, 5, 4);
  // stem
  g.lineStyle(4, COLORS.leaf, 1);
  g.lineBetween(0, 18, 0, 42);
  g.fillStyle(COLORS.leaf, 1);
  g.fillEllipse(-12, 34, 14, 7);
  g.fillEllipse(12, 36, 14, 7);

  const c = scene.add.container(x, y, [g]);
  c.setScale(scale);
  return c;
}

/** Simple blossom for garden / particles */
export function drawFlowerSprite(
  scene: Phaser.Scene,
  color: number,
  size = 24,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    g.fillStyle(color, 1);
    g.fillCircle(Math.cos(a) * size * 0.35, Math.sin(a) * size * 0.35, size * 0.28);
  }
  g.fillStyle(COLORS.butter, 1);
  g.fillCircle(0, 0, size * 0.18);
  return g;
}

/** Burst of petals at world position */
export function spawnPetalBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  count = 8,
): void {
  for (let i = 0; i < count; i++) {
    const petal = scene.add.ellipse(
      x,
      y,
      10 + Math.random() * 8,
      6 + Math.random() * 4,
      color,
      0.95,
    );
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 40 + Math.random() * 70;
    scene.tweens.add({
      targets: petal,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist - 20,
      alpha: 0,
      scale: 0.3,
      angle: 120 + Math.random() * 180,
      duration: 480 + Math.random() * 280,
      ease: 'Cubic.easeOut',
      onComplete: () => petal.destroy(),
    });
  }
}

export function drawEmptyBoardCell(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  highlight = false,
): void {
  g.fillStyle(highlight ? 0xffe0ec : 0xfffaf7, 1);
  g.fillRoundedRect(x + 2, y + 2, size - 4, size - 4, 10);
  g.lineStyle(1.5, COLORS.gridLine, 0.9);
  g.strokeRoundedRect(x + 2, y + 2, size - 4, size - 4, 10);
}
