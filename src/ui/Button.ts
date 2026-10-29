import Phaser from 'phaser';
import { playSfx } from '../services/audio';
import { Haptic } from '../services/haptics';
import { FONT, UI } from './theme';

export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  onClick: () => void,
  opts?: { color?: number; fontSize?: string },
): Phaser.GameObjects.Container {
  const color = opts?.color ?? UI.button;
  const bg = scene.add.rectangle(0, 0, w, h, color, 1).setStrokeStyle(3, UI.buttonDark);
  bg.setInteractive({ useHandCursor: true });
  const text = scene.add
    .text(0, 0, label, {
      ...FONT.body,
      fontSize: opts?.fontSize ?? '24px',
      color: '#fff',
    })
    .setOrigin(0.5);
  const c = scene.add.container(x, y, [bg, text]);
  bg.on('pointerdown', () => {
    scene.tweens.add({ targets: c, scale: 0.94, duration: 60, yoyo: true });
    playSfx('click');
    Haptic.tap();
    onClick();
  });
  // ensure min touch ~88px
  if (h < 88) bg.setSize(w, Math.max(h, 72));
  return c;
}

export function makeIconButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
): Phaser.GameObjects.Container {
  return makeButton(scene, x, y, 88, 88, label, onClick, { fontSize: '20px' });
}
