import Phaser from 'phaser';
import { COLORS, LOGICAL_W } from '../config/layout';
import { STAGE_COUNT } from '../data/stages';
import { showRewardedAd } from '../platform/createAds';
import { setAdMuted } from '../services/audio';
import { t } from '../services/i18n';
import { updateSave } from '../services/save';
import { makeButton } from '../ui/Button';
import { drawBloomMascot, paintGardenBackdrop, spawnPetalBurst } from '../ui/draw';
import { FONT, UI } from '../ui/theme';

interface ResultData {
  mode: 'stage' | 'endless';
  stageId: number;
  won: boolean;
  score: number;
  stars: number;
  coins: number;
  seeds: number;
}

export class ResultScene extends Phaser.Scene {
  private result!: ResultData;
  private doubled = false;

  constructor() {
    super('Result');
  }

  init(data: ResultData): void {
    this.result = data;
    this.doubled = false;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(UI.cream);
    paintGardenBackdrop(this);
    const { won, score, stars, coins, seeds, mode, stageId } = this.result;

    const mascot = drawBloomMascot(this, LOGICAL_W / 2, 150, won ? 1.4 : 1.0);
    if (won) {
      this.tweens.add({
        targets: mascot,
        scale: 1.55,
        duration: 700,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.easeInOut',
      });
      spawnPetalBurst(this, LOGICAL_W / 2, 200, COLORS.blush, 12);
      spawnPetalBurst(this, LOGICAL_W / 2 - 80, 240, COLORS.lavender, 8);
      spawnPetalBurst(this, LOGICAL_W / 2 + 80, 240, COLORS.mint, 8);
    } else {
      mascot.setAlpha(0.85);
      this.tweens.add({
        targets: mascot,
        angle: { from: -6, to: 6 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.add
      .text(LOGICAL_W / 2, 280, won ? t('game.win') : t('game.over'), {
        ...FONT.title,
        fontSize: '48px',
        color: won ? UI.accentHex : UI.text,
      })
      .setOrigin(0.5);

    if (mode === 'stage' && won) {
      this.add
        .text(LOGICAL_W / 2, 350, '★'.repeat(stars) + '☆'.repeat(3 - stars), {
          ...FONT.title,
          fontSize: '44px',
          color: '#ffc857',
        })
        .setOrigin(0.5);
    }

    const card = this.add.graphics();
    card.fillStyle(UI.shadow, 0.18);
    card.fillRoundedRect(90 + 4, 400 + 6, 540, 180, 28);
    card.fillStyle(UI.panel, 1);
    card.fillRoundedRect(90, 400, 540, 180, 28);
    card.lineStyle(3, UI.panelStroke, 1);
    card.strokeRoundedRect(90, 400, 540, 180, 28);

    this.add
      .text(LOGICAL_W / 2, 445, `${t('game.score')}: ${score}`, FONT.h2)
      .setOrigin(0.5);
    const coinText = this.add
      .text(LOGICAL_W / 2, 500, t('result.coins', { n: coins }), FONT.body)
      .setOrigin(0.5);
    this.add
      .text(LOGICAL_W / 2, 545, `🌱 ${t('result.seeds', { n: seeds })}`, FONT.body)
      .setOrigin(0.5);

    makeButton(
      this,
      LOGICAL_W / 2,
      660,
      440,
      88,
      t('result.double'),
      () => {
        if (this.doubled) return;
        void (async () => {
          const ok = await showRewardedAd(
            () => setAdMuted(true),
            () => setAdMuted(false),
          );
          if (ok) {
            this.doubled = true;
            updateSave((s) => {
              s.coins += coins;
            });
            coinText.setText(t('result.coins', { n: coins * 2 }));
          } else {
            coinText.setText(t('ads.failed'));
          }
        })();
      },
      { color: UI.sky },
    );

    if (mode === 'stage' && won && stageId < STAGE_COUNT) {
      makeButton(this, LOGICAL_W / 2, 770, 440, 96, t('result.next'), () => {
        this.scene.start('Game', { mode: 'stage', stageId: stageId + 1 });
      });
    }

    makeButton(
      this,
      LOGICAL_W / 2,
      880,
      440,
      88,
      t('result.retry'),
      () => {
        this.scene.start('Game', { mode, stageId });
      },
      { color: UI.peach },
    );

    makeButton(
      this,
      LOGICAL_W / 2,
      990,
      440,
      88,
      mode === 'stage' ? t('map.title') : t('result.home'),
      () => {
        this.scene.start(mode === 'stage' ? 'StageMap' : 'Home');
      },
      { color: UI.lavender },
    );
  }
}
