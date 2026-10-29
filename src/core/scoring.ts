import {
  clearLines,
  cloneBoard,
  canPlace,
  countBloomLines,
  findClearedLines,
  isBoardEmpty,
  place,
  type ClearedLines,
} from './board';
import type { BoardState, PieceInstance, ScoreBreakdown } from './types';

export function comboMultiplier(combo: number): number {
  if (combo <= 0) return 1;
  return Math.min(2.0, 1 + 0.25 * (combo - 1));
}

export function lineClearScore(lineCount: number, combo: number): number {
  if (lineCount <= 0) return 0;
  const base = 10 * lineCount * lineCount;
  return Math.floor(base * comboMultiplier(combo));
}

export function bloomBonus(bloomLines: number): number {
  return bloomLines * 50;
}

export const PERFECT_CLEAR_BONUS = 300;

/**
 * Apply a placement: place piece, find lines (bloom checked before clear), clear, score.
 * After a clear, combo becomes comboBefore+1; after no clear, combo resets to 0.
 */
export function applyPlacement(
  board: BoardState,
  piece: PieceInstance,
  atR: number,
  atC: number,
  comboBefore: number,
): ScoreBreakdown | null {
  if (!place(board, piece, atR, atC)) return null;

  const lines = findClearedLines(board);
  const lineCount = lines.rows.length + lines.cols.length;
  const blooms = lineCount > 0 ? countBloomLines(board, lines) : 0;
  const seedsGained = lineCount > 0 ? clearLines(board, lines) : 0;

  const placeScore = piece.cellCount;
  let comboAfter = 0;
  let linesScore = 0;
  let bloom = 0;
  let perfect = 0;

  if (lineCount > 0) {
    comboAfter = comboBefore + 1;
    linesScore = lineClearScore(lineCount, comboAfter);
    bloom = bloomBonus(blooms);
    if (isBoardEmpty(board)) perfect = PERFECT_CLEAR_BONUS;
  } else {
    comboAfter = 0;
  }

  return {
    place: placeScore,
    lines: linesScore,
    bloom,
    perfect,
    total: placeScore + linesScore + bloom + perfect,
    comboMultiplier: lineCount > 0 ? comboMultiplier(comboAfter) : 1,
    linesCleared: lineCount,
    bloomLines: blooms,
    seedsGained,
    comboAfter,
  };
}

export function previewClears(
  board: BoardState,
  piece: PieceInstance,
  atR: number,
  atC: number,
): ClearedLines | null {
  if (!canPlace(board, piece, atR, atC)) return null;
  const b = cloneBoard(board);
  place(b, piece, atR, atC);
  return findClearedLines(b);
}

export function starsForPlacements(
  placements: number,
  thresholds: { three: number; two: number },
): 1 | 2 | 3 {
  if (placements <= thresholds.three) return 3;
  if (placements <= thresholds.two) return 2;
  return 1;
}

export function round50(n: number): number {
  return Math.round(n / 50) * 50;
}

export function defaultScoreTarget(stageId: number): number {
  return round50(300 + 45 * (stageId - 1));
}
