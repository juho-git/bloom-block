import Phaser from 'phaser';
import { LOGICAL_H, LOGICAL_W } from '../config/layout';
import { getShapes } from '../core/pieces';
import { getAllStages } from '../data/stages';
import { initAds } from '../platform/createAds';
import { t } from '../services/i18n';
import { loadSave } from '../services/save';
import { FONT, UI } from '../ui/theme';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(UI.cream);
    const title = this.add
      .text(LOGICAL_W / 2, LOGICAL_H / 2 - 80, t('app.title'), { ...FONT.title, fontSize: '56px' })
      .setOrigin(0.5);
    const barBg = this.add.rectangle(LOGICAL_W / 2, LOGICAL_H / 2 + 40, 400, 24, 0xd7ccc8);
    const bar = this.add.rectangle(LOGICAL_W / 2 - 200, LOGICAL_H / 2 + 40, 0, 20, UI.accent).setOrigin(0, 0.5);
    const status = this.add
      .text(LOGICAL_W / 2, LOGICAL_H / 2 + 90, t('loading'), FONT.small)
      .setOrigin(0.5);

    void this.boot(bar, status, title);
  }

  private async boot(
    bar: Phaser.GameObjects.Rectangle,
    status: Phaser.GameObjects.Text,
    _title: Phaser.GameObjects.Text,
  ): Promise<void> {
    const steps = [
      () => {
        loadSave();
      },
      () => {
        getShapes();
      },
      () => {
        getAllStages();
      },
      () => initAds(),
    ];
    for (let i = 0; i < steps.length; i++) {
      await steps[i]!();
      const p = (i + 1) / steps.length;
      bar.width = 400 * p;
      await new Promise((r) => setTimeout(r, 80));
    }
    status.setText('✓');
    this.time.delayedCall(200, () => this.scene.start('Home'));
  }
}
