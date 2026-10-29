import Phaser from 'phaser';
import { LOGICAL_H, LOGICAL_W } from '../config/layout';
import { STAGE_COUNT } from '../data/stages';
import { t } from '../services/i18n';
import { isStageUnlocked, loadSave } from '../services/save';
import { makeButton } from '../ui/Button';
import { FONT, UI } from '../ui/theme';

export class StageMapScene extends Phaser.Scene {
  constructor() {
    super('StageMap');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(UI.cream);
    this.add.text(LOGICAL_W / 2, 60, t('map.title'), FONT.h1).setOrigin(0.5);
    makeButton(this, 100, 60, 140, 64, t('map.back'), () => this.scene.start('Home'), {
      color: 0xbcaaa4,
      fontSize: '20px',
    });

    const save = loadSave();
    const contentH = 40 + STAGE_COUNT * 100 + 120;
    this.cameras.main.setBounds(0, 0, LOGICAL_W, Math.max(LOGICAL_H, contentH));

    for (let i = 1; i <= STAGE_COUNT; i++) {
      const y = 140 + (i - 1) * 100;
      const unlocked = isStageUnlocked(save, i);
      const stars = save.stage.stars[String(i)] ?? 0;
      const bg = this.add
        .rectangle(LOGICAL_W / 2, y, 520, 80, unlocked ? UI.panel : 0xe0e0e0)
        .setStrokeStyle(3, UI.panelStroke);
      const label = unlocked ? `${i}` : `${i} 🔒`;
      this.add.text(140, y, label, FONT.h2).setOrigin(0, 0.5);
      const starStr = unlocked ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : t('map.locked');
      this.add.text(520, y, starStr, { ...FONT.body, color: '#ffa000' }).setOrigin(1, 0.5);

      if (unlocked) {
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => {
          this.scene.start('Game', { mode: 'stage', stageId: i });
        });
      }
    }

    // drag scroll
    let dragging = false;
    let lastY = 0;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      dragging = true;
      lastY = p.y;
    });
    this.input.on('pointerup', () => {
      dragging = false;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!dragging || !p.isDown) return;
      const dy = p.y - lastY;
      lastY = p.y;
      this.cameras.main.scrollY = Phaser.Math.Clamp(
        this.cameras.main.scrollY - dy,
        0,
        Math.max(0, contentH - LOGICAL_H),
      );
    });
  }
}
