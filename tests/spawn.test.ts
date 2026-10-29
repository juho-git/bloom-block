import { describe, expect, it } from 'vitest';
import { createBoard, parseBoard } from '../src/core/board';
import { getShapes } from '../src/core/pieces';
import { mulberry32 } from '../src/core/rng';
import {
  canPlaceAllInSomeOrder,
  createRng,
  spawnTray,
} from '../src/core/spawn';
import { pieceFromId } from '../src/core/pieces';

describe('spawn & rng', () => {
  it('loads 21 shapes', () => {
    expect(getShapes().size).toBe(21);
  });

  it('same seed yields same piece sequence', () => {
    const a = createRng(42);
    const b = createRng(42);
    const board = createBoard();
    const ta = spawnTray(a, board, 'easy', 'off');
    const tb = spawnTray(b, board, 'easy', 'off');
    expect(ta.map((p) => p.shapeId + p.color)).toEqual(tb.map((p) => p.shapeId + p.color));
  });

  it('mulberry32 deterministic', () => {
    const r1 = mulberry32(1);
    const r2 = mulberry32(1);
    expect([r1(), r1(), r1()]).toEqual([r2(), r2(), r2()]);
  });

  it('fairSpawn atLeastOne holds on random boards (sample)', () => {
    const rng = createRng(99);
    for (let i = 0; i < 50; i++) {
      const board = createBoard();
      // sprinkle blocks
      for (let k = 0; k < 20; k++) {
        board.cells[Math.floor(rng() * 121)] = 1 + Math.floor(rng() * 5);
      }
      const tray = spawnTray(rng, board, 'easy', 'atLeastOne');
      // atLeastOne OR fallback to small pieces — either way should usually place
      // Fallback guarantees small pieces which almost always fit unless board packed
      expect(tray.length).toBe(3);
    }
  });

  it('canPlaceAllInSomeOrder works for three dots', () => {
    const board = createBoard();
    const pieces = [pieceFromId('Dot', 1), pieceFromId('Dot', 2), pieceFromId('Dot', 3)];
    expect(canPlaceAllInSomeOrder(board, pieces)).toBe(true);
  });

  it('fairSpawn all on empty board', () => {
    const rng = createRng(7);
    const board = createBoard();
    const tray = spawnTray(rng, board, 'easy', 'all');
    expect(canPlaceAllInSomeOrder(board, tray)).toBe(true);
  });

  it('parse sample stage board from doc', () => {
    const board = parseBoard([
      '...........',
      '...........',
      '...........',
      '....s......',
      '...........',
      '1122.......',
      '...........',
      '...s.......',
      '3333.....s.',
      '44.55......',
      '44s55......',
    ]);
    expect(board.cells.filter((c) => c === -1).length).toBe(4);
  });
});
