import Phaser from 'phaser';
import { LOGICAL_H, LOGICAL_W } from '../config/layout';
import { getShapes } from '../core/pieces';
import { getAllStages } from '../data/stages';
import { initAds } from '../platform/createAds';
import { t } from '../services/i18n';
import { loadSave } from '../services/save';
import { drawBloomMascot, paintGardenBackdrop } from '../ui/draw';
import { FONT, UI } from '../ui/theme';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(UI.cream);
    paintGardenBackdrop(this);
    drawBloomMascot(this, LOGICAL_W / 2, LOGICAL_H / 2 - 160, 1.2);

    this.add
      .text(LOGICAL_W / 2, LOGICAL_H / 2 - 40, t('app.title'), {
        ...FONT.title,
        fontSize: '56px',
      })
      .setOrigin(0.5);

    const barBg = this.add.graphics();
    barBg.fillStyle(UI.panelStroke, 0.55);
    barBg.fillRoundedRect(LOGICAL_W / 2 - 200, LOGICAL_H / 2 + 40, 400, 22, 11);

    const bar = this.add.graphics();
    const status = this.add
      .text(LOGICAL_W / 2, LOGICAL_H / 2 + 90, t('loading'), FONT.small)
      .setOrigin(0.5);

    void this.boot(bar, status);
  }

  private async boot(bar: Phaser.GameObjects.Graphics, status: Phaser.GameObjects.Text): Promise<void> {
    const steps = [() => loadSave(), () => getShapes(), () => getAllStages(), () => initAds()];
    for (let i = 0; i < steps.length; i++) {
      await steps[i]!();
      const p = (i + 1) / steps.length;
      bar.clear();
      bar.fillStyle(UI.accent, 1);
      bar.fillRoundedRect(LOGICAL_W / 2 - 200, LOGICAL_H / 2 + 40, 400 * p, 22, 11);
      await new Promise((r) => setTimeout(r, 90));
    }
    status.setText('🌼');
    this.time.delayedCall(220, () => this.scene.start('Home'));
  }
}
