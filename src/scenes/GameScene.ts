import Phaser from 'phaser';
import {
  BOARD_ORIGIN_X,
  BOARD_ORIGIN_Y,
  BOARD_SIZE,
  BLOCK_COLORS,
  CELL,
  COLORS,
  DRAG_OFFSET_Y,
  LOGICAL_H,
  LOGICAL_W,
  TRAY_CELL,
  TRAY_Y,
} from '../config/layout';
import { SEED, canPlace, getCell, type ClearedLines } from '../core/board';
import {
  getGoalProgress,
  getStars,
  placePiece,
  revive,
  startEndless,
  startStage,
  useBomb,
  useRefresh,
  useSweep,
  useUndo,
  type GameRun,
} from '../core/game';
import { previewClears } from '../core/scoring';
import type { BoosterId, PieceInstance, ScoreBreakdown } from '../core/types';
import { getStage } from '../data/stages';
import { getAds, maybeShowInterstitial, showRewardedAd } from '../platform/createAds';
import { playSfx, setAdMuted } from '../services/audio';
import { Haptic } from '../services/haptics';
import { t } from '../services/i18n';
import { loadSave, recordEndless, recordStageClear, updateSave } from '../services/save';
import { makeButton } from '../ui/Button';
import {
  drawEmptyBoardCell,
  drawJellyBlock,
  drawSeedCell,
  paintGardenBackdrop,
  spawnPetalBurst,
} from '../ui/draw';
import { FONT, UI } from '../ui/theme';

interface GameInit {
  mode: 'stage' | 'endless';
  stageId?: number;
}

type BoosterMode = null | 'bomb' | 'sweep';

export class GameScene extends Phaser.Scene {
  private run!: GameRun;
  private mode!: 'stage' | 'endless';
  private stageId = 0;
  private cellGfx!: Phaser.GameObjects.Graphics;
  private ghostGfx!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private goalText!: Phaser.GameObjects.Text;
  private trayContainers: Phaser.GameObjects.Container[] = [];
  private dragPiece: PieceInstance | null = null;
  private dragTrayIndex = -1;
  private dragVisual: Phaser.GameObjects.Container | null = null;
  private ghostPos: { r: number; c: number } | null = null;
  private paused = false;
  private overlay: Phaser.GameObjects.Container | null = null;
  private boosterMode: BoosterMode = null;
  private boosterLabels: Record<BoosterId, Phaser.GameObjects.Text> = {} as Record<
    BoosterId,
    Phaser.GameObjects.Text
  >;
  private tutorialText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('Game');
  }

  init(data: GameInit): void {
    this.mode = data.mode ?? 'stage';
    this.stageId = data.stageId ?? 1;
    this.paused = false;
    this.boosterMode = null;
    this.dragPiece = null;
    this.overlay = null;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.cream);
    paintGardenBackdrop(this);
    if (this.mode === 'stage') {
      this.run = startStage(getStage(this.stageId));
    } else {
      this.run = startEndless((Date.now() ^ 0xabcdef) >>> 0);
    }

    getAds().gameplayStart();

    this.drawHudChrome();
    this.cellGfx = this.add.graphics();
    this.ghostGfx = this.add.graphics();
    this.redrawBoard();
    this.buildTray();
    this.buildBoosters();
    this.setupInput();
    this.showTutorialIfNeeded();
    this.refreshHud();
  }

  private drawHudChrome(): void {
    const g = this.add.graphics();
    g.fillStyle(UI.shadow, 0.2);
    g.fillRoundedRect(24 + 3, 28 + 5, LOGICAL_W - 48, 150, 28);
    g.fillStyle(UI.panel, 0.96);
    g.fillRoundedRect(24, 28, LOGICAL_W - 48, 150, 28);
    g.lineStyle(3, UI.panelStroke, 1);
    g.strokeRoundedRect(24, 28, LOGICAL_W - 48, 150, 28);
    this.scoreText = this.add.text(48, 48, '', { ...FONT.h2, fontSize: '30px' });
    this.goalText = this.add.text(48, 108, '', { ...FONT.body, fontSize: '20px', color: UI.textLight });
    makeButton(this, LOGICAL_W - 90, 100, 110, 72, '⏸', () => this.openPause(), {
      color: UI.lavender,
      fontSize: '28px',
    });
  }

  private refreshHud(): void {
    this.scoreText.setText(`${t('game.score')}: ${this.run.score}`);
    if (this.mode === 'stage') {
      const g = getGoalProgress(this.run)!;
      const parts: string[] = [];
      if (g.scoreTarget !== null) parts.push(`${g.score}/${g.scoreTarget}`);
      if (g.seedsTarget !== null) parts.push(`${t('game.seeds')} ${g.seeds}/${g.seedsTarget}`);
      this.goalText.setText(`${t('game.goal')}: ${parts.join(' · ')}`);
    } else {
      this.goalText.setText(`${t('game.seeds')}: ${this.run.seeds}`);
    }
    this.refreshBoosterLabels();
  }

  private boardPixel(r: number, c: number): { x: number; y: number } {
    return {
      x: BOARD_ORIGIN_X + c * CELL + CELL / 2,
      y: BOARD_ORIGIN_Y + r * CELL + CELL / 2,
    };
  }

  private redrawBoard(highlight?: ClearedLines): void {
    const g = this.cellGfx;
    g.clear();
    // wooden-soft board frame
    g.fillStyle(UI.shadow, 0.2);
    g.fillRoundedRect(
      BOARD_ORIGIN_X - 12 + 3,
      BOARD_ORIGIN_Y - 12 + 5,
      BOARD_SIZE * CELL + 24,
      BOARD_SIZE * CELL + 24,
      22,
    );
    g.fillStyle(COLORS.boardFrame, 1);
    g.fillRoundedRect(
      BOARD_ORIGIN_X - 12,
      BOARD_ORIGIN_Y - 12,
      BOARD_SIZE * CELL + 24,
      BOARD_SIZE * CELL + 24,
      22,
    );
    g.fillStyle(COLORS.boardBg, 1);
    g.fillRoundedRect(
      BOARD_ORIGIN_X - 4,
      BOARD_ORIGIN_Y - 4,
      BOARD_SIZE * CELL + 8,
      BOARD_SIZE * CELL + 8,
      16,
    );
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const x = BOARD_ORIGIN_X + c * CELL;
        const y = BOARD_ORIGIN_Y + r * CELL;
        const v = getCell(this.run.board, r, c);
        const hl = !!highlight && (highlight.rows.includes(r) || highlight.cols.includes(c));
        drawEmptyBoardCell(g, x, y, CELL, hl);
        if (v === SEED) {
          drawSeedCell(g, x, y, CELL);
        } else if (v >= 1 && v <= 5) {
          drawJellyBlock(g, x, y, CELL, v);
        }
      }
    }
  }

  private drawGhost(piece: PieceInstance, atR: number, atC: number, clears: ClearedLines | null): void {
    const g = this.ghostGfx;
    g.clear();
    if (clears) {
      g.fillStyle(0xffb7c5, 0.28);
      for (const r of clears.rows) {
        g.fillRoundedRect(BOARD_ORIGIN_X, BOARD_ORIGIN_Y + r * CELL, BOARD_SIZE * CELL, CELL, 8);
      }
      for (const c of clears.cols) {
        g.fillRoundedRect(BOARD_ORIGIN_X + c * CELL, BOARD_ORIGIN_Y, CELL, BOARD_SIZE * CELL, 8);
      }
    }
    for (const cell of piece.cells) {
      const r = atR + cell.r;
      const c = atC + cell.c;
      const x = BOARD_ORIGIN_X + c * CELL;
      const y = BOARD_ORIGIN_Y + r * CELL;
      drawJellyBlock(g, x, y, CELL, piece.color, 0.5);
    }
  }

  private clearGhost(): void {
    this.ghostGfx.clear();
    this.ghostPos = null;
  }

  private buildTray(): void {
    for (const c of this.trayContainers) c.destroy();
    this.trayContainers = [];
    const slotW = 200;
    const startX = LOGICAL_W / 2 - slotW;
    for (let i = 0; i < 3; i++) {
      const piece = this.run.tray[i];
      const cx = startX + i * slotW;
      const cy = TRAY_Y + 90;
      const slotGfx = this.add.graphics();
      slotGfx.fillStyle(UI.shadow, 0.18);
      slotGfx.fillRoundedRect(-90 + 3, -80 + 5, 180, 160, 24);
      slotGfx.fillStyle(UI.panel, 1);
      slotGfx.fillRoundedRect(-90, -80, 180, 160, 24);
      slotGfx.lineStyle(3, UI.panelStroke, 1);
      slotGfx.strokeRoundedRect(-90, -80, 180, 160, 24);
      const hit = this.add.rectangle(0, 0, 180, 160, 0x000000, 0.001);
      const container = this.add.container(cx, cy, [slotGfx, hit]);
      if (piece) {
        const visual = this.makePieceVisual(piece, TRAY_CELL);
        container.add(visual);
        const startDrag = (p: Phaser.Input.Pointer) => {
          if (this.paused || this.run.over || this.boosterMode) return;
          this.beginDrag(i, piece, p);
        };
        hit.setInteractive({ useHandCursor: true });
        hit.on('pointerdown', startDrag);
      }
      this.trayContainers.push(container);
    }
  }

  private makePieceVisual(piece: PieceInstance, cell: number): Phaser.GameObjects.Container {
    const c = this.add.container(0, 0);
    const ox = -((piece.width * cell) / 2);
    const oy = -((piece.height * cell) / 2);
    const g = this.add.graphics();
    for (const cellPos of piece.cells) {
      drawJellyBlock(g, ox + cellPos.c * cell, oy + cellPos.r * cell, cell, piece.color);
    }
    c.add(g);
    return c;
  }

  private beginDrag(trayIndex: number, piece: PieceInstance, pointer: Phaser.Input.Pointer): void {
    this.dragTrayIndex = trayIndex;
    this.dragPiece = piece;
    this.trayContainers[trayIndex]?.setVisible(false);
    this.dragVisual = this.makePieceVisual(piece, CELL);
    this.dragVisual.setPosition(pointer.x, pointer.y - DRAG_OFFSET_Y);
    this.tweens.add({ targets: this.dragVisual, scale: 1.05, duration: 80 });
  }

  private setupInput(): void {
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.dragPiece || !this.dragVisual || this.paused) return;
      this.dragVisual.setPosition(p.x, p.y - DRAG_OFFSET_Y);
      this.updateGhostFromPointer(p);
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.boosterMode && !this.dragPiece) {
        this.handleBoosterTap(p);
        return;
      }
      if (!this.dragPiece) return;
      this.finishDrag(p);
    });
  }

  private pointerToCell(p: Phaser.Input.Pointer): { r: number; c: number } {
    const gy = p.y - DRAG_OFFSET_Y;
    const c = Math.round((p.x - BOARD_ORIGIN_X - CELL / 2) / CELL);
    const r = Math.round((gy - BOARD_ORIGIN_Y - CELL / 2) / CELL);
    return { r, c };
  }

  private findNearestValid(
    piece: PieceInstance,
    preferR: number,
    preferC: number,
    overBoard: boolean,
  ): { r: number; c: number } | null {
    let best: { r: number; c: number; d: number } | null = null;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!canPlace(this.run.board, piece, r, c)) continue;
        const d = Math.abs(r - preferR) + Math.abs(c - preferC);
        if (!best || d < best.d) best = { r, c, d };
      }
    }
    if (!best) return null;
    if (canPlace(this.run.board, piece, preferR, preferC)) return { r: preferR, c: preferC };
    // While dragging over the board, snap to nearest valid cell (generous for touch)
    if (overBoard) return { r: best.r, c: best.c };
    if (best.d <= 4) return { r: best.r, c: best.c };
    return null;
  }

  private isOverBoard(p: Phaser.Input.Pointer): boolean {
    const gy = p.y - DRAG_OFFSET_Y;
    return (
      p.x >= BOARD_ORIGIN_X - CELL &&
      p.x <= BOARD_ORIGIN_X + BOARD_SIZE * CELL + CELL &&
      gy >= BOARD_ORIGIN_Y - CELL &&
      gy <= BOARD_ORIGIN_Y + BOARD_SIZE * CELL + CELL
    );
  }

  private updateGhostFromPointer(p: Phaser.Input.Pointer): void {
    if (!this.dragPiece) return;
    const { r, c } = this.pointerToCell(p);
    const anchor = this.findNearestValid(this.dragPiece, r, c, this.isOverBoard(p));
    if (!anchor) {
      this.clearGhost();
      return;
    }
    this.ghostPos = anchor;
    const clears = previewClears(this.run.board, this.dragPiece, anchor.r, anchor.c);
    this.drawGhost(this.dragPiece, anchor.r, anchor.c, clears);
  }

  private finishDrag(p: Phaser.Input.Pointer): void {
    const piece = this.dragPiece!;
    const trayIndex = this.dragTrayIndex;
    // refresh snap one last time on release
    const { r, c } = this.pointerToCell(p);
    const pos =
      this.findNearestValid(piece, r, c, this.isOverBoard(p)) ?? this.ghostPos;
    this.dragVisual?.destroy();
    this.dragVisual = null;
    this.dragPiece = null;
    this.clearGhost();

    if (pos) {
      const result = placePiece(this.run, trayIndex, pos.r, pos.c);
      if (result) {
        playSfx('place');
        Haptic.place();
        this.tweens.add({
          targets: this.cameras.main,
          zoom: 1.012,
          duration: 90,
          yoyo: true,
          ease: 'Sine.easeInOut',
        });
        if (result.linesCleared > 0) {
          playSfx(result.bloomLines > 0 ? 'bloom' : 'clear', this.run.combo);
          Haptic.clear();
          this.animateClear(result, piece.color);
        } else {
          this.redrawBoard();
        }
        this.tutorialText?.destroy();
        this.tutorialText = null;
        this.buildTray();
        this.refreshHud();
        if (this.run.over) {
          this.time.delayedCall(500, () => this.onRunOver());
        }
        return;
      }
    }
    // return to tray
    this.trayContainers[trayIndex]?.setVisible(true);
  }

  private animateClear(result: ScoreBreakdown, color: number): void {
    // petal bursts along cleared lines (board already cleared in core)
    const petalColor = BLOCK_COLORS[Math.max(0, color - 1)] ?? COLORS.blush;
    for (let n = 0; n < Math.min(result.linesCleared, 4); n++) {
      const px = BOARD_ORIGIN_X + (2 + n * 2) * CELL + CELL / 2;
      const py = BOARD_ORIGIN_Y + (3 + n) * CELL + CELL / 2;
      spawnPetalBurst(this, px, py, petalColor, result.bloomLines > 0 ? 10 : 7);
    }
    if (result.bloomLines > 0) {
      spawnPetalBurst(this, LOGICAL_W / 2, BOARD_ORIGIN_Y + 5 * CELL, COLORS.butter, 12);
    }
    this.redrawBoard();
  }

  private buildBoosters(): void {
    const ids: BoosterId[] = ['undo', 'refresh', 'bomb', 'sweep'];
    const labels = ['↩', '🔄', '💣', '━'];
    const colors = [UI.peach, UI.sky, UI.accent, UI.mint];
    const startX = 90;
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]!;
      const x = startX + i * 160;
      const y = 940;
      const btn = makeButton(this, x, y, 140, 80, labels[i]!, () => this.onBooster(id), {
        color: colors[i],
        fontSize: '26px',
      });
      const count = this.add
        .text(x + 50, y - 28, '', { ...FONT.small, fontSize: '15px', color: UI.textLight })
        .setOrigin(0.5);
      this.boosterLabels[id] = count;
      void btn;
    }
    this.refreshBoosterLabels();
  }

  private refreshBoosterLabels(): void {
    const save = loadSave();
    (['undo', 'refresh', 'bomb', 'sweep'] as BoosterId[]).forEach((id) => {
      const n = save.boosters[id];
      const used = this.run.boosterUses[id];
      this.boosterLabels[id]?.setText(`${n} (${3 - used})`);
    });
  }

  private onBooster(id: BoosterId): void {
    if (this.paused || this.run.over) return;
    const save = loadSave();
    if (save.boosters[id] <= 0) {
      void this.offerBoosterAd(id);
      return;
    }
    if (id === 'undo') {
      if (useUndo(this.run)) {
        updateSave((s) => {
          s.boosters.undo -= 1;
        });
        this.redrawBoard();
        this.buildTray();
        this.refreshHud();
      }
      return;
    }
    if (id === 'refresh') {
      if (useRefresh(this.run)) {
        updateSave((s) => {
          s.boosters.refresh -= 1;
        });
        this.buildTray();
        this.refreshHud();
        if (this.run.over) this.onRunOver();
      }
      return;
    }
    if (id === 'bomb') {
      this.boosterMode = 'bomb';
      this.goalText.setText('폭탄: 칸을 탭하세요');
      return;
    }
    if (id === 'sweep') {
      this.boosterMode = 'sweep';
      this.goalText.setText('줄 비우기: 가로/세로 칸을 탭');
    }
  }

  private handleBoosterTap(p: Phaser.Input.Pointer): void {
    const c = Math.floor((p.x - BOARD_ORIGIN_X) / CELL);
    const r = Math.floor((p.y - BOARD_ORIGIN_Y) / CELL);
    if (r < 0 || c < 0 || r >= BOARD_SIZE || c >= BOARD_SIZE) {
      this.boosterMode = null;
      this.refreshHud();
      return;
    }
    if (this.boosterMode === 'bomb') {
      if (useBomb(this.run, r, c) !== null) {
        updateSave((s) => {
          s.boosters.bomb -= 1;
        });
        this.redrawBoard();
        this.refreshHud();
      }
    } else if (this.boosterMode === 'sweep') {
      // choose row or col based on which is fuller toward edges of cell
      const localX = (p.x - BOARD_ORIGIN_X) % CELL;
      const localY = (p.y - BOARD_ORIGIN_Y) % CELL;
      const kind: 'row' | 'col' = Math.abs(localX - CELL / 2) < Math.abs(localY - CELL / 2) ? 'col' : 'row';
      if (useSweep(this.run, kind, kind === 'row' ? r : c) !== null) {
        updateSave((s) => {
          s.boosters.sweep -= 1;
        });
        this.redrawBoard();
        this.refreshHud();
      }
    }
    this.boosterMode = null;
    if (this.run.over) this.onRunOver();
  }

  private async offerBoosterAd(id: BoosterId): Promise<void> {
    this.paused = true;
    const ok = await showRewardedAd(
      () => setAdMuted(true),
      () => setAdMuted(false),
    );
    this.paused = false;
    if (ok) {
      updateSave((s) => {
        s.boosters[id] += 1;
      });
      this.refreshBoosterLabels();
    } else {
      this.flashToast(t('ads.failed'));
    }
  }

  private flashToast(msg: string): void {
    const txt = this.add.text(LOGICAL_W / 2, 860, msg, FONT.body).setOrigin(0.5);
    this.tweens.add({
      targets: txt,
      alpha: 0,
      y: 820,
      duration: 1200,
      onComplete: () => txt.destroy(),
    });
  }

  private showTutorialIfNeeded(): void {
    const save = loadSave();
    if (this.mode === 'stage' && this.stageId === 1 && !save.tutorial.stage1) {
      this.tutorialText = this.add
        .text(LOGICAL_W / 2, 860, t('tutorial.drag'), {
          ...FONT.body,
          backgroundColor: '#fff0f3',
          color: UI.text,
        })
        .setOrigin(0.5)
        .setPadding(14, 10);
      updateSave((s) => {
        s.tutorial.stage1 = true;
      });
    }
    if (this.mode === 'stage' && this.stageId === 2 && !save.tutorial.stage2) {
      this.tutorialText = this.add
        .text(LOGICAL_W / 2, 860, t('tutorial.seed'), {
          ...FONT.body,
          backgroundColor: '#fff0f3',
          color: UI.text,
        })
        .setOrigin(0.5)
        .setPadding(14, 10);
      updateSave((s) => {
        s.tutorial.stage2 = true;
      });
    }
  }

  private openPause(): void {
    if (this.paused || this.overlay) return;
    this.paused = true;
    getAds().gameplayStop();
    const bg = this.add.rectangle(LOGICAL_W / 2, LOGICAL_H / 2, LOGICAL_W, LOGICAL_H, 0x000000, 0.45);
    const panel = this.add.rectangle(LOGICAL_W / 2, LOGICAL_H / 2, 520, 520, UI.panel).setStrokeStyle(3, UI.panelStroke);
    const title = this.add.text(LOGICAL_W / 2, LOGICAL_H / 2 - 200, t('game.pause'), FONT.h1).setOrigin(0.5);
    this.overlay = this.add.container(0, 0, [bg, panel, title]);
    const resume = makeButton(this, LOGICAL_W / 2, LOGICAL_H / 2 - 80, 360, 88, t('game.resume'), () => {
      this.closeOverlay();
      this.paused = false;
      getAds().gameplayStart();
    });
    const restart = makeButton(this, LOGICAL_W / 2, LOGICAL_H / 2 + 30, 360, 88, t('game.restart'), () => {
      this.closeOverlay();
      this.scene.restart({ mode: this.mode, stageId: this.stageId });
    }, { color: 0xffb74d });
    const home = makeButton(this, LOGICAL_W / 2, LOGICAL_H / 2 + 140, 360, 88, t('game.home'), () => {
      this.closeOverlay();
      getAds().gameplayStop();
      this.scene.start('Home');
    }, { color: 0xbcaaa4 });
    this.overlay.add([resume, restart, home]);
  }

  private closeOverlay(): void {
    this.overlay?.destroy(true);
    this.overlay = null;
  }

  private async onRunOver(): Promise<void> {
    getAds().gameplayStop();
    if (this.run.won) {
      playSfx('win');
      Haptic.win();
      await this.finishToResult(true);
      return;
    }
    playSfx('fail');
    Haptic.over();
    if (!this.run.revived) {
      this.showRevive();
    } else {
      await this.finishToResult(false);
    }
  }

  private showRevive(): void {
    this.paused = true;
    const bg = this.add.rectangle(LOGICAL_W / 2, LOGICAL_H / 2, LOGICAL_W, LOGICAL_H, 0x000000, 0.5);
    const panel = this.add.rectangle(LOGICAL_W / 2, LOGICAL_H / 2, 560, 420, UI.panel).setStrokeStyle(3, UI.panelStroke);
    const title = this.add.text(LOGICAL_W / 2, LOGICAL_H / 2 - 140, t('game.over'), FONT.h2).setOrigin(0.5);
    this.overlay = this.add.container(0, 0, [bg, panel, title]);
    const reviveBtn = makeButton(this, LOGICAL_W / 2, LOGICAL_H / 2 - 20, 420, 96, t('game.revive'), () => {
      void this.doRevive();
    }, { color: 0x81d4fa });
    const give = makeButton(this, LOGICAL_W / 2, LOGICAL_H / 2 + 110, 420, 88, t('game.giveup'), () => {
      void this.finishToResult(false);
    }, { color: 0xbcaaa4 });
    give.setAlpha(0.4);
    give.setActive(false);
    this.time.delayedCall(3000, () => {
      give.setAlpha(1);
      give.setActive(true);
    });
    this.overlay.add([reviveBtn, give]);
  }

  private async doRevive(): Promise<void> {
    const ok = await showRewardedAd(
      () => setAdMuted(true),
      () => setAdMuted(false),
    );
    if (!ok) {
      this.flashToast(t('ads.failed'));
      return;
    }
    if (revive(this.run)) {
      this.closeOverlay();
      this.paused = false;
      this.redrawBoard();
      this.buildTray();
      this.refreshHud();
      getAds().gameplayStart();
    }
  }

  private async finishToResult(won: boolean): Promise<void> {
    this.closeOverlay();
    this.paused = true;
    const stageId = this.mode === 'stage' ? this.stageId : null;
    await maybeShowInterstitial(
      stageId,
      () => setAdMuted(true),
      () => setAdMuted(false),
    );

    let coins = 0;
    let stars = 0;
    let seeds = this.run.seeds;
    if (this.mode === 'stage' && this.run.stage) {
      stars = getStars(this.run);
      coins = this.run.linesTotal + (won ? 20 + 10 * stars : 0);
      if (won) {
        recordStageClear(
          this.stageId,
          stars,
          coins,
          seeds,
          this.run.stage.rewards.boosterDrop ?? null,
        );
      }
    } else {
      recordEndless(this.run.score);
      coins = Math.floor(this.run.score / 100);
      updateSave((s) => {
        s.coins += coins;
      });
    }

    this.scene.start('Result', {
      mode: this.mode,
      stageId: this.stageId,
      won,
      score: this.run.score,
      stars,
      coins,
      seeds,
    });
  }
}
