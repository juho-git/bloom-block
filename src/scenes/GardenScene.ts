import Phaser from 'phaser';
import flowers from '../data/flowers.json';
import { LOGICAL_H, LOGICAL_W } from '../config/layout';
import { t } from '../services/i18n';
import { loadSave, updateSave, type GardenPlot } from '../services/save';
import { makeButton } from '../ui/Button';
import { FONT, UI } from '../ui/theme';

export class GardenScene extends Phaser.Scene {
  private selectedSeed: string | null = null;

  constructor() {
    super('Garden');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(UI.cream);
    this.add.text(LOGICAL_W / 2, 50, t('garden.title'), FONT.h1).setOrigin(0.5);
    makeButton(this, 100, 50, 140, 64, t('map.back'), () => this.scene.start('Home'), {
      color: 0xbcaaa4,
      fontSize: '20px',
    });

    this.drawSeedBag();
    this.drawPlots();
    this.drawCatalog();
  }

  private drawSeedBag(): void {
    const save = loadSave();
    this.add.text(40, 110, '씨앗 주머니', FONT.body);
    let x = 40;
    for (const f of flowers.flowers) {
      const n = save.garden.seeds[f.id] ?? 0;
      const btn = makeButton(
        this,
        x + 70,
        180,
        130,
        72,
        `${f.nameKo}\n×${n}`,
        () => {
          this.selectedSeed = n > 0 ? f.id : null;
        },
        { color: Phaser.Display.Color.HexStringToColor(f.color).color, fontSize: '16px' },
      );
      void btn;
      x += 140;
    }
  }

  private drawPlots(): void {
    const save = loadSave();
    const startX = 80;
    const startY = 280;
    const size = 140;
    for (let i = 0; i < 12; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = startX + col * (size + 20) + size / 2;
      const y = startY + row * (size + 20) + size / 2;
      const plot = save.garden.plots[i];
      const bg = this.add
        .rectangle(x, y, size, size, 0xc8e6c9)
        .setStrokeStyle(3, 0x81c784)
        .setInteractive({ useHandCursor: true });
      let label = t('garden.empty');
      if (plot) {
        const f = flowers.flowers.find((x) => x.id === plot.type);
        label = `${f?.nameKo ?? plot.type}\n${'🌱'.repeat(Math.min(plot.grow, 3))}`;
      }
      const text = this.add.text(x, y, label, { ...FONT.small, align: 'center' }).setOrigin(0.5);
      bg.on('pointerdown', () => {
        if (plot) return;
        if (!this.selectedSeed) {
          text.setText(t('garden.noSeeds'));
          return;
        }
        const seed = this.selectedSeed;
        updateSave((s) => {
          if ((s.garden.seeds[seed] ?? 0) <= 0) return;
          s.garden.seeds[seed]! -= 1;
          s.garden.plots[i] = { type: seed, grow: 0 } satisfies GardenPlot;
        });
        this.scene.restart();
      });
    }
  }

  private drawCatalog(): void {
    const save = loadSave();
    this.add.text(LOGICAL_W / 2, 780, t('garden.catalog'), FONT.h2).setOrigin(0.5);
    let x = 80;
    for (const f of flowers.flowers) {
      const unlocked = save.garden.catalog.includes(f.id);
      this.add
        .circle(x + 40, 880, 36, Phaser.Display.Color.HexStringToColor(f.color).color, unlocked ? 1 : 0.25)
        .setStrokeStyle(2, UI.panelStroke);
      this.add
        .text(x + 40, 940, unlocked ? f.nameKo : '?', FONT.small)
        .setOrigin(0.5);
      x += 130;
    }
    if (save.garden.catalog.length >= 5) {
      this.add.text(LOGICAL_W / 2, 1000, '도감 완성! 부스터 세트 지급됨', FONT.small).setOrigin(0.5);
    }
  }
}
