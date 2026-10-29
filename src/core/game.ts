import {
  clearBomb,
  clearFullestRows,
  clearSweep,
  cloneBoard,
  createBoard,
  hasAnyMove,
  type BoardState,
} from './board';
import { computeStars, goalProgress, loadStageBoard, type GoalProgress } from './goals';
import { applyPlacement } from './scoring';
import { createRng, endlessTier, spawnTray } from './spawn';
import type {
  BoosterId,
  FairSpawn,
  PieceInstance,
  PieceTier,
  ScoreBreakdown,
  StageData,
} from './types';

export type RunMode = 'stage' | 'endless';

export interface Snapshot {
  board: BoardState;
  tray: Array<PieceInstance | null>;
  score: number;
  seeds: number;
  combo: number;
  placements: number;
  linesTotal: number;
}

export interface GameRun {
  mode: RunMode;
  stage: StageData | null;
  board: BoardState;
  tray: Array<PieceInstance | null>;
  score: number;
  seeds: number;
  combo: number;
  placements: number;
  linesTotal: number;
  rng: () => number;
  tier: PieceTier;
  fair: FairSpawn;
  over: boolean;
  won: boolean;
  undoStack: Snapshot[];
  boosterUses: Record<BoosterId, number>;
  revived: boolean;
}

const MAX_BOOSTER_PER_STAGE = 3;

export function startStage(stage: StageData): GameRun {
  const board = loadStageBoard(stage);
  const rng = createRng(stage.seed);
  const tray = spawnTray(rng, board, stage.pieceTier, stage.fairSpawn);
  return {
    mode: 'stage',
    stage,
    board,
    tray,
    score: 0,
    seeds: 0,
    combo: 0,
    placements: 0,
    linesTotal: 0,
    rng,
    tier: stage.pieceTier,
    fair: stage.fairSpawn,
    over: false,
    won: false,
    undoStack: [],
    boosterUses: { undo: 0, refresh: 0, bomb: 0, sweep: 0 },
    revived: false,
  };
}

export function startEndless(seed: number): GameRun {
  const board = createBoard(11);
  const rng = createRng(seed);
  const tier: PieceTier = 'easy';
  const tray = spawnTray(rng, board, tier, 'atLeastOne');
  return {
    mode: 'endless',
    stage: null,
    board,
    tray,
    score: 0,
    seeds: 0,
    combo: 0,
    placements: 0,
    linesTotal: 0,
    rng,
    tier,
    fair: 'atLeastOne',
    over: false,
    won: false,
    undoStack: [],
    boosterUses: { undo: 0, refresh: 0, bomb: 0, sweep: 0 },
    revived: false,
  };
}

function snap(run: GameRun): Snapshot {
  return {
    board: cloneBoard(run.board),
    tray: run.tray.map((p) => (p ? { ...p, cells: p.cells.map((c) => ({ ...c })) } : null)),
    score: run.score,
    seeds: run.seeds,
    combo: run.combo,
    placements: run.placements,
    linesTotal: run.linesTotal,
  };
}

function refillIfNeeded(run: GameRun): void {
  if (run.tray.every((p) => p === null)) {
    if (run.mode === 'endless') {
      run.tier = endlessTier(run.score);
    }
    run.tray = spawnTray(run.rng, run.board, run.tier, run.fair);
  }
}

function checkEnd(run: GameRun): void {
  if (run.mode === 'stage' && run.stage) {
    const g = goalProgress(run.stage.goals, run.score, run.seeds);
    if (g.won) {
      run.won = true;
      run.over = true;
      return;
    }
  }
  if (!hasAnyMove(run.board, run.tray)) {
    run.over = true;
    run.won = false;
  }
}

export function placePiece(
  run: GameRun,
  trayIndex: number,
  atR: number,
  atC: number,
): ScoreBreakdown | null {
  if (run.over) return null;
  const piece = run.tray[trayIndex];
  if (!piece) return null;

  run.undoStack.push(snap(run));
  if (run.undoStack.length > 1) run.undoStack.shift(); // keep last only for undo

  const result = applyPlacement(run.board, piece, atR, atC, run.combo);
  if (!result) {
    run.undoStack.pop();
    return null;
  }

  run.tray[trayIndex] = null;
  run.score += result.total;
  run.seeds += result.seedsGained;
  run.combo = result.comboAfter;
  run.placements += 1;
  run.linesTotal += result.linesCleared;

  refillIfNeeded(run);
  checkEnd(run);
  return result;
}

export function getGoalProgress(run: GameRun): GoalProgress | null {
  if (!run.stage) return null;
  return goalProgress(run.stage.goals, run.score, run.seeds);
}

export function getStars(run: GameRun): 1 | 2 | 3 | 0 {
  if (!run.won || !run.stage) return 0;
  return computeStars(run.stage, run.placements);
}

export function canUseBooster(run: GameRun, id: BoosterId): boolean {
  return run.boosterUses[id] < MAX_BOOSTER_PER_STAGE && !run.over;
}

export function useUndo(run: GameRun): boolean {
  if (!canUseBooster(run, 'undo')) return false;
  const prev = run.undoStack.pop();
  if (!prev) return false;
  run.board = prev.board;
  run.tray = prev.tray;
  run.score = prev.score;
  run.seeds = prev.seeds;
  run.combo = prev.combo;
  run.placements = prev.placements;
  run.linesTotal = prev.linesTotal;
  run.boosterUses.undo += 1;
  run.over = false;
  run.won = false;
  return true;
}

export function useRefresh(run: GameRun): boolean {
  if (!canUseBooster(run, 'refresh')) return false;
  run.tray = spawnTray(run.rng, run.board, run.tier, run.fair);
  run.boosterUses.refresh += 1;
  checkEnd(run);
  return true;
}

export function useBomb(run: GameRun, r: number, c: number): number | null {
  if (!canUseBooster(run, 'bomb')) return null;
  run.undoStack.push(snap(run));
  const seeds = clearBomb(run.board, r, c);
  run.seeds += seeds;
  run.boosterUses.bomb += 1;
  checkEnd(run);
  return seeds;
}

export function useSweep(
  run: GameRun,
  kind: 'row' | 'col',
  index: number,
): number | null {
  if (!canUseBooster(run, 'sweep')) return null;
  run.undoStack.push(snap(run));
  const seeds = clearSweep(run.board, kind, index);
  run.seeds += seeds;
  run.boosterUses.sweep += 1;
  checkEnd(run);
  return seeds;
}

export function revive(run: GameRun): boolean {
  if (!run.over || run.won || run.revived) return false;
  clearFullestRows(run.board, 3);
  run.tray = spawnTray(run.rng, run.board, run.tier, run.fair);
  run.over = false;
  run.revived = true;
  checkEnd(run);
  return true;
}

export { MAX_BOOSTER_PER_STAGE };
