/**
 * Greedy solver bot for stage clear-rate estimation.
 */
import {
  canPlace,
  findClearedLines,
  clearLines,
  cloneBoard,
  hasAnyMove,
} from '../src/core/board';
import { goalProgress, loadStageBoard } from '../src/core/goals';
import { createRng, spawnTray } from '../src/core/spawn';
import type { PieceInstance, StageData } from '../src/core/types';

function tryPlaceBest(
  board: ReturnType<typeof cloneBoard>,
  tray: Array<PieceInstance | null>,
): { trayIndex: number; r: number; c: number } | null {
  let best: { trayIndex: number; r: number; c: number; score: number } | null = null;
  for (let i = 0; i < tray.length; i++) {
    const p = tray[i];
    if (!p) continue;
    for (let r = 0; r < board.size; r++) {
      for (let c = 0; c < board.size; c++) {
        if (!canPlace(board, p, r, c)) continue;
        const b = cloneBoard(board);
        for (const cell of p.cells) {
          b.cells[(r + cell.r) * b.size + (c + cell.c)] = p.color;
        }
        const lines = findClearedLines(b);
        const lineCount = lines.rows.length + lines.cols.length;
        const score = lineCount * 100 + p.cellCount;
        if (!best || score > best.score) best = { trayIndex: i, r, c, score };
      }
    }
  }
  return best ? { trayIndex: best.trayIndex, r: best.r, c: best.c } : null;
}

export function simulateOnce(stage: StageData, maxPlacements = 200): boolean {
  const board = loadStageBoard(stage);
  const rng = createRng(stage.seed ^ 0xdead);
  let tray: Array<PieceInstance | null> = spawnTray(
    rng,
    board,
    stage.pieceTier,
    stage.fairSpawn,
  );
  let score = 0;
  let seeds = 0;
  let placements = 0;

  while (placements < maxPlacements) {
    const g = goalProgress(stage.goals, score, seeds);
    if (g.won) return true;
    if (!hasAnyMove(board, tray)) return false;
    const move = tryPlaceBest(board, tray);
    if (!move) return false;
    const piece = tray[move.trayIndex]!;
    for (const cell of piece.cells) {
      board.cells[(move.r + cell.r) * board.size + (move.c + cell.c)] = piece.color;
    }
    score += piece.cellCount;
    const lines = findClearedLines(board);
    const lc = lines.rows.length + lines.cols.length;
    if (lc > 0) {
      seeds += clearLines(board, lines);
      score += 10 * lc * lc;
    }
    tray[move.trayIndex] = null;
    placements++;
    if (tray.every((p) => p === null)) {
      tray = spawnTray(rng, board, stage.pieceTier, stage.fairSpawn);
    }
  }
  return goalProgress(stage.goals, score, seeds).won;
}

export function simulateClearRate(stage: StageData, runs = 100): number {
  let wins = 0;
  for (let i = 0; i < runs; i++) {
    const s = { ...stage, seed: (stage.seed + i * 9973) >>> 0 };
    if (simulateOnce(s)) wins++;
  }
  return wins / runs;
}
