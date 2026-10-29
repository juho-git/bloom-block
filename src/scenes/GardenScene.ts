import Phaser from 'phaser';
import flowers from '../data/flowers.json';
import { COLORS, LOGICAL_W } from '../config/layout';
import { t } from '../services/i18n';
import { loadSave, updateSave, type GardenPlot } from '../services/save';
import { makeButton } from '../ui/Button';
import { drawBloomMascot, drawFlowerSprite, paintGardenBackdrop } from '../ui/draw';
import { FONT, UI } from '../ui/theme';

export class GardenScene extends Phaser.Scene {
  private selectedSeed: string | null = null;

  constructor() {
    super('Garden');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(UI.cream);
    paintGardenBackdrop(this);
    drawBloomMascot(this, LOGICAL_W - 90, 70, 0.7);

    this.add.text(LOGICAL_W / 2, 50, `🌷 ${t('garden.title')}`, FONT.h1).setOrigin(0.5);
    makeButton(this, 100, 50, 140, 64, t('map.back'), () => this.scene.start('Home'), {
      color: UI.lavender,
      fontSize: '20px',
    });

    this.drawSeedBag();
    this.drawPlots();
    this.drawCatalog();
  }

  private drawSeedBag(): void {
    const save = loadSave();
    this.add.text(48, 110, '씨앗 주머니', { ...FONT.body, color: UI.textLight });
    let x = 48;
    for (const f of flowers.flowers) {
      const n = save.garden.seeds[f.id] ?? 0;
      const color = Phaser.Display.Color.HexStringToColor(f.color).color;
      makeButton(
        this,
        x + 62,
        185,
        120,
        76,
        `${f.nameKo}\n×${n}`,
        () => {
          this.selectedSeed = n > 0 ? f.id : null;
        },
        { color, fontSize: '16px' },
      );
      x += 132;
    }
  }

  private drawPlots(): void {
    const save = loadSave();
    const startX = 56;
    const startY = 280;
    const size = 145;
    for (let i = 0; i < 12; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = startX + col * (size + 16) + size / 2;
      const y = startY + row * (size + 16) + size / 2;
      const plot = save.garden.plots[i];

      const g = this.add.graphics();
      g.fillStyle(UI.shadow, 0.2);
      g.fillRoundedRect(x - size / 2 + 3, y - size / 2 + 5, size, size, 22);
      g.fillStyle(0xd8efd0, 1);
      g.fillRoundedRect(x - size / 2, y - size / 2, size, size, 22);
      g.lineStyle(3, 0xa5d6a7, 1);
      g.strokeRoundedRect(x - size / 2, y - size / 2, size, size, 22);
      // soil mound
      g.fillStyle(COLORS.soil, 0.55);
      g.fillEllipse(x, y + 28, size * 0.7, 28);

      const hit = this.add
        .rectangle(x, y, size, size, 0x000000, 0.001)
        .setInteractive({ useHandCursor: true });

      if (plot) {
        const f = flowers.flowers.find((x) => x.id === plot.type);
        const color = Phaser.Display.Color.HexStringToColor(f?.color ?? '#FF8A80').color;
        const grow = Math.min(plot.grow, 3);
        if (grow <= 0) {
          g.fillStyle(COLORS.butter, 1);
          g.fillEllipse(x, y + 10, 14, 18);
        } else if (grow === 1) {
          g.lineStyle(4, COLORS.leaf, 1);
          g.lineBetween(x, y + 20, x, y - 10);
          g.fillStyle(COLORS.leaf, 1);
          g.fillEllipse(x - 10, y, 12, 6);
        } else if (grow === 2) {
          const bud = drawFlowerSprite(this, color, 18);
          bud.setPosition(x, y - 8);
        } else {
          const bloom = drawFlowerSprite(this, color, 28);
          bloom.setPosition(x, y - 12);
        }
        this.add
          .text(x, y + 48, f?.nameKo ?? '', { ...FONT.small, fontSize: '14px' })
          .setOrigin(0.5);
      } else {
        this.add
          .text(x, y, t('garden.empty'), { ...FONT.small, color: UI.textLight, fontSize: '15px' })
          .setOrigin(0.5);
      }

      hit.on('pointerdown', () => {
        if (plot) return;
        if (!this.selectedSeed) return;
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
    this.add.text(LOGICAL_W / 2, 790, `📖 ${t('garden.catalog')}`, FONT.h2).setOrigin(0.5);
    let x = 70;
    for (const f of flowers.flowers) {
      const unlocked = save.garden.catalog.includes(f.id);
      const color = Phaser.Display.Color.HexStringToColor(f.color).color;
      const flower = drawFlowerSprite(this, color, unlocked ? 26 : 18);
      flower.setPosition(x + 40, 880);
      flower.setAlpha(unlocked ? 1 : 0.28);
      this.add
        .text(x + 40, 940, unlocked ? f.nameKo : '?', {
          ...FONT.small,
          color: unlocked ? UI.text : UI.textLight,
        })
        .setOrigin(0.5);
      x += 130;
    }
    if (save.garden.catalog.length >= 5) {
      this.add
        .text(LOGICAL_W / 2, 1010, '도감 완성! 부스터 세트 지급됨 🎀', FONT.small)
        .setOrigin(0.5);
    }
  }
}
