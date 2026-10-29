import Phaser from 'phaser';
import { LOGICAL_H, LOGICAL_W } from '../config/layout';
import { STAGE_COUNT } from '../data/stages';
import { showRewardedAd } from '../platform/createAds';
import { setAdMuted } from '../services/audio';
import { t } from '../services/i18n';
import { updateSave } from '../services/save';
import { makeButton } from '../ui/Button';
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
    const { won, score, stars, coins, seeds, mode, stageId } = this.result;

    this.add
      .text(LOGICAL_W / 2, 180, won ? t('game.win') : t('game.over'), FONT.title)
      .setOrigin(0.5);

    if (mode === 'stage' && won) {
      this.add
        .text(LOGICAL_W / 2, 280, '★'.repeat(stars) + '☆'.repeat(3 - stars), {
          ...FONT.title,
          fontSize: '48px',
          color: '#ffa000',
        })
        .setOrigin(0.5);
    }

    this.add.text(LOGICAL_W / 2, 380, `${t('game.score')}: ${score}`, FONT.h2).setOrigin(0.5);
    const coinText = this.add
      .text(LOGICAL_W / 2, 450, t('result.coins', { n: coins }), FONT.body)
      .setOrigin(0.5);
    this.add.text(LOGICAL_W / 2, 500, t('result.seeds', { n: seeds }), FONT.body).setOrigin(0.5);

    makeButton(this, LOGICAL_W / 2, 620, 420, 88, t('result.double'), () => {
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
    }, { color: 0x81d4fa });

    if (mode === 'stage' && won && stageId < STAGE_COUNT) {
      makeButton(this, LOGICAL_W / 2, 740, 420, 96, t('result.next'), () => {
        this.scene.start('Game', { mode: 'stage', stageId: stageId + 1 });
      });
    }

    makeButton(this, LOGICAL_W / 2, 860, 420, 88, t('result.retry'), () => {
      this.scene.start('Game', { mode, stageId });
    }, { color: 0xffb74d });

    makeButton(this, LOGICAL_W / 2, 970, 420, 88, mode === 'stage' ? t('map.title') : t('result.home'), () => {
      this.scene.start(mode === 'stage' ? 'StageMap' : 'Home');
    }, { color: 0xbcaaa4 });
  }
}
