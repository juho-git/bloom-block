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
  opts?: { color?: number; fontSize?: string; textColor?: string },
): Phaser.GameObjects.Container {
  const color = opts?.color ?? UI.button;
  const radius = Math.min(28, h / 2);
  const shadow = scene.add.graphics();
  shadow.fillStyle(UI.shadow, 0.28);
  shadow.fillRoundedRect(-w / 2 + 3, -h / 2 + 5, w, h, radius);

  const bg = scene.add.graphics();
  bg.fillStyle(color, 1);
  bg.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
  // soft top gloss
  const hi = Phaser.Display.Color.IntegerToColor(color);
  const lighter = Phaser.Display.Color.GetColor(
    Math.min(255, hi.red + 28),
    Math.min(255, hi.green + 28),
    Math.min(255, hi.blue + 28),
  );
  bg.fillStyle(lighter, 0.35);
  bg.fillRoundedRect(-w / 2 + 4, -h / 2 + 3, w - 8, h * 0.38, radius * 0.7);
  bg.lineStyle(3, UI.white, 0.35);
  bg.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);

  const hit = scene.add.rectangle(0, 0, w, Math.max(h, 72), 0x000000, 0.001);
  hit.setInteractive({ useHandCursor: true });

  const text = scene.add
    .text(0, 0, label, {
      ...FONT.button,
      fontSize: opts?.fontSize ?? '26px',
      color: opts?.textColor ?? '#ffffff',
      align: 'center',
    })
    .setOrigin(0.5);

  const c = scene.add.container(x, y, [shadow, bg, hit, text]);
  hit.on('pointerdown', () => {
    scene.tweens.add({
      targets: c,
      scale: 0.96,
      duration: 90,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
    playSfx('click');
    Haptic.tap();
    onClick();
  });
  hit.on('pointerover', () => {
    scene.tweens.add({ targets: c, scale: 1.03, duration: 120, ease: 'Sine.easeOut' });
  });
  hit.on('pointerout', () => {
    scene.tweens.add({ targets: c, scale: 1, duration: 120, ease: 'Sine.easeOut' });
  });
  return c;
}

export function makeIconButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
): Phaser.GameObjects.Container {
  return makeButton(scene, x, y, 88, 88, label, onClick, { fontSize: '22px' });
}
