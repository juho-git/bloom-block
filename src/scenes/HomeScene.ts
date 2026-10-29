import Phaser from 'phaser';
import { LOGICAL_H, LOGICAL_W } from '../config/layout';
import { t } from '../services/i18n';
import { loadSave } from '../services/save';
import { playSfx } from '../services/audio';
import { makeButton } from '../ui/Button';
import { FONT, UI } from '../ui/theme';

export class HomeScene extends Phaser.Scene {
  constructor() {
    super('Home');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(UI.cream);
    // soft garden atmosphere
    for (let i = 0; i < 8; i++) {
      const x = 60 + i * 90;
      const y = 180 + (i % 3) * 40;
      this.add.circle(x, y, 28 + (i % 4) * 6, [0xff8a80, 0xffe082, 0x80cbc4, 0x81d4fa, 0xb39ddb][i % 5], 0.35);
    }

    this.add
      .text(LOGICAL_W / 2, 220, t('app.title'), { ...FONT.title, fontSize: '64px' })
      .setOrigin(0.5);

    const save = loadSave();
    this.add
      .text(LOGICAL_W / 2, 300, t('home.coins', { n: save.coins }), FONT.body)
      .setOrigin(0.5);

    makeButton(this, LOGICAL_W / 2, 480, 420, 96, t('home.play'), () => {
      this.scene.start('StageMap');
    });
    makeButton(this, LOGICAL_W / 2, 600, 420, 96, t('home.endless'), () => {
      this.scene.start('Game', { mode: 'endless' });
    }, { color: 0x81d4fa });
    makeButton(this, LOGICAL_W / 2, 720, 420, 96, t('home.garden'), () => {
      this.scene.start('Garden');
    }, { color: 0xaed581 });
    makeButton(this, LOGICAL_W / 2, 840, 420, 88, t('home.settings'), () => {
      this.scene.start('Settings');
    }, { color: 0xbcaaa4 });

    if (save.endless.best > 0) {
      this.add
        .text(LOGICAL_W / 2, 960, t('endless.best', { n: save.endless.best }), FONT.small)
        .setOrigin(0.5);
    }

    playSfx('click');
  }
}
