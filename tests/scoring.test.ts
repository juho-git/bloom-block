import { describe, expect, it } from 'vitest';
import { createBoard, parseBoard, setCell } from '../src/core/board';
import { pieceFromId } from '../src/core/pieces';
import {
  applyPlacement,
  bloomBonus,
  comboMultiplier,
  lineClearScore,
  PERFECT_CLEAR_BONUS,
  starsForPlacements,
} from '../src/core/scoring';

describe('scoring', () => {
  it('place score equals cell count', () => {
    const board = createBoard();
    const p = pieceFromId('I3H', 1);
    const r = applyPlacement(board, p, 0, 0, 0)!;
    expect(r.place).toBe(3);
    expect(r.total).toBe(3);
    expect(r.comboAfter).toBe(0);
  });

  it('1 line clear scores 10', () => {
    expect(lineClearScore(1, 1)).toBe(10);
  });

  it('2 lines simultaneous score 40', () => {
    expect(lineClearScore(2, 1)).toBe(40);
  });

  it('3 lines simultaneous score 90', () => {
    expect(lineClearScore(3, 1)).toBe(90);
  });

  it('combo multiplier caps at 2.0', () => {
    expect(comboMultiplier(1)).toBe(1);
    expect(comboMultiplier(2)).toBe(1.25);
    expect(comboMultiplier(5)).toBe(2);
    expect(comboMultiplier(10)).toBe(2);
  });

  it('combo resets when no clear', () => {
    const board = createBoard();
    const p = pieceFromId('Dot', 1);
    const r = applyPlacement(board, p, 0, 0, 3)!;
    expect(r.comboAfter).toBe(0);
  });

  it('bloom bonus is +50 per same-color line', () => {
    expect(bloomBonus(2)).toBe(100);
    // fill row with same color except last empty, place last
    const rows = Array.from({ length: 11 }, (_, r) =>
      r === 0 ? '1111111111.' : '...........',
    );
    const board = parseBoard(rows);
    const p = pieceFromId('Dot', 1);
    const result = applyPlacement(board, p, 0, 10, 0)!;
    expect(result.bloomLines).toBe(1);
    expect(result.bloom).toBe(50);
    expect(result.lines).toBe(10);
  });

  it('perfect clear grants 300', () => {
    // 11 cells in one row of color 2, place last Dot of color 2 to clear and empty board
    const board = createBoard();
    for (let c = 0; c < 10; c++) setCell(board, 0, c, 2);
    const p = pieceFromId('Dot', 2);
    const r = applyPlacement(board, p, 0, 10, 0)!;
    expect(r.perfect).toBe(PERFECT_CLEAR_BONUS);
    expect(r.total).toBe(1 + 10 + 50 + 300);
  });

  it('stars thresholds', () => {
    expect(starsForPlacements(10, { three: 12, two: 20 })).toBe(3);
    expect(starsForPlacements(15, { three: 12, two: 20 })).toBe(2);
    expect(starsForPlacements(25, { three: 12, two: 20 })).toBe(1);
  });
});
