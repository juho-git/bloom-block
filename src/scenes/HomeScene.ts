import Phaser from 'phaser';
import { LOGICAL_W } from '../config/layout';
import { playSfx } from '../services/audio';
import { t } from '../services/i18n';
import { loadSave } from '../services/save';
import { makeButton } from '../ui/Button';
import { drawBloomMascot, paintGardenBackdrop } from '../ui/draw';
import { FONT, UI } from '../ui/theme';

export class HomeScene extends Phaser.Scene {
  constructor() {
    super('Home');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(UI.cream);
    paintGardenBackdrop(this);

    const mascot = drawBloomMascot(this, LOGICAL_W / 2, 175, 1.35);
    this.tweens.add({
      targets: mascot,
      y: mascot.y - 10,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add
      .text(LOGICAL_W / 2, 300, t('app.title'), {
        ...FONT.title,
        fontSize: '68px',
        color: UI.text,
      })
      .setOrigin(0.5)
      .setShadow(0, 4, '#f0c8bc', 8, true, true);

    const save = loadSave();
    const coinChip = this.add.container(LOGICAL_W / 2, 370);
    const chipBg = this.add.graphics();
    chipBg.fillStyle(UI.panel, 1);
    chipBg.fillRoundedRect(-110, -22, 220, 44, 22);
    chipBg.lineStyle(2, UI.panelStroke, 1);
    chipBg.strokeRoundedRect(-110, -22, 220, 44, 22);
    const coinTxt = this.add
      .text(0, 0, `🌼  ${t('home.coins', { n: save.coins })}`, {
        ...FONT.body,
        fontSize: '20px',
      })
      .setOrigin(0.5);
    coinChip.add([chipBg, coinTxt]);

    makeButton(this, LOGICAL_W / 2, 500, 440, 100, `🌸  ${t('home.play')}`, () => {
      this.scene.start('StageMap');
    });
    makeButton(
      this,
      LOGICAL_W / 2,
      620,
      440,
      96,
      `☁️  ${t('home.endless')}`,
      () => {
        this.scene.start('Game', { mode: 'endless' });
      },
      { color: UI.sky },
    );
    makeButton(
      this,
      LOGICAL_W / 2,
      740,
      440,
      96,
      `🌷  ${t('home.garden')}`,
      () => {
        this.scene.start('Garden');
      },
      { color: UI.mint },
    );
    makeButton(
      this,
      LOGICAL_W / 2,
      860,
      440,
      88,
      t('home.settings'),
      () => {
        this.scene.start('Settings');
      },
      { color: UI.lavender },
    );

    if (save.endless.best > 0) {
      this.add
        .text(LOGICAL_W / 2, 970, t('endless.best', { n: save.endless.best }), {
          ...FONT.small,
          color: UI.textLight,
        })
        .setOrigin(0.5);
    }

    this.add
      .text(LOGICAL_W / 2, 1220, '오늘도 예쁜 꽃을 피워 볼까요?', {
        ...FONT.small,
        color: UI.textLight,
      })
      .setOrigin(0.5);

    playSfx('click');
  }
}
