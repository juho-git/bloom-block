import { describe, expect, it } from 'vitest';
import {
  canPlace,
  clearLines,
  createBoard,
  findClearedLines,
  hasAnyMove,
  parseBoard,
  place,
  setCell,
} from '../src/core/board';
import { pieceFromId } from '../src/core/pieces';

describe('board placement', () => {
  it('rejects out-of-bounds placement', () => {
    const board = createBoard(11);
    const p = pieceFromId('I3H', 1);
    expect(canPlace(board, p, 0, 9)).toBe(false);
    expect(canPlace(board, p, 0, 8)).toBe(true);
  });

  it('rejects occupied cells', () => {
    const board = createBoard(11);
    setCell(board, 0, 0, 2);
    const p = pieceFromId('Dot', 1);
    expect(canPlace(board, p, 0, 0)).toBe(false);
    expect(place(board, p, 0, 1)).toBe(true);
  });

  it('clears a full row', () => {
    const rows = Array.from({ length: 11 }, (_, r) =>
      r === 5 ? '11111111111' : '...........',
    );
    const board = parseBoard(rows);
    const lines = findClearedLines(board);
    expect(lines.rows).toEqual([5]);
    expect(lines.cols).toEqual([]);
    clearLines(board, lines);
    expect(board.cells.every((c) => c === 0)).toBe(true);
  });

  it('clears a full column', () => {
    const rows = Array.from({ length: 11 }, () => '1..........');
    const board = parseBoard(rows);
    const lines = findClearedLines(board);
    expect(lines.cols).toEqual([0]);
    clearLines(board, lines);
    expect(board.cells.every((c) => c === 0)).toBe(true);
  });

  it('clears intersecting row+col once', () => {
    const rows = [
      '11111111111',
      '1..........',
      '1..........',
      '1..........',
      '1..........',
      '1..........',
      '1..........',
      '1..........',
      '1..........',
      '1..........',
      '1..........',
    ];
    const board = parseBoard(rows);
    const lines = findClearedLines(board);
    expect(lines.rows).toEqual([0]);
    expect(lines.cols).toEqual([0]);
    const seeds = clearLines(board, lines);
    expect(seeds).toBe(0);
    // intersection cleared once — board empty on row0 and col0
    for (let c = 0; c < 11; c++) expect(board.cells[c]).toBe(0);
    for (let r = 0; r < 11; r++) expect(board.cells[r * 11]).toBe(0);
  });

  it('collects seeds on clear', () => {
    const rows = Array.from({ length: 11 }, (_, r) =>
      r === 0 ? '11111s11111' : '...........',
    );
    const board = parseBoard(rows);
    const seeds = clearLines(board, findClearedLines(board));
    expect(seeds).toBe(1);
  });

  it('hasAnyMove detects no moves', () => {
    const board = createBoard(11);
    // fill almost everything leaving nowhere for O2
    for (let i = 0; i < board.cells.length; i++) board.cells[i] = 1;
    const p = pieceFromId('O2', 2);
    expect(hasAnyMove(board, [p])).toBe(false);
  });
});
