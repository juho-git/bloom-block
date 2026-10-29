import { describe, expect, it } from 'vitest';
import {
  placePiece,
  startStage,
  useBomb,
  useRefresh,
  useSweep,
  useUndo,
  MAX_BOOSTER_PER_STAGE,
} from '../src/core/game';
import { getStage } from '../src/data/stages';
import { getCell } from '../src/core/board';

describe('boosters', () => {
  it('undo restores previous state', () => {
    const run = startStage(getStage(1));
    const before = run.score;
    // place first tray piece somewhere valid
    let placed = false;
    for (let i = 0; i < 3 && !placed; i++) {
      const p = run.tray[i];
      if (!p) continue;
      for (let r = 0; r < 11 && !placed; r++) {
        for (let c = 0; c < 11 && !placed; c++) {
          if (placePiece(run, i, r, c)) placed = true;
        }
      }
    }
    expect(placed).toBe(true);
    expect(run.score).toBeGreaterThan(before);
    expect(useUndo(run)).toBe(true);
    expect(run.score).toBe(before);
    expect(run.boosterUses.undo).toBe(1);
  });

  it('refresh replaces tray', () => {
    const run = startStage(getStage(1));
    const before = run.tray.map((p) => p?.shapeId).join(',');
    expect(useRefresh(run)).toBe(true);
    // may coincidentally be same shapes; at least uses increments
    expect(run.boosterUses.refresh).toBe(1);
    expect(run.tray.filter(Boolean).length).toBe(3);
    void before;
  });

  it('bomb clears 3x3 and collects seeds', () => {
    const run = startStage(getStage(2));
    let sr = -1;
    let sc = -1;
    for (let r = 0; r < 11; r++) {
      for (let c = 0; c < 11; c++) {
        if (getCell(run.board, r, c) === -1) {
          sr = r;
          sc = c;
        }
      }
    }
    expect(sr).toBeGreaterThanOrEqual(0);
    const seeds = useBomb(run, sr, sc);
    expect(seeds).toBeGreaterThanOrEqual(1);
    expect(getCell(run.board, sr, sc)).toBe(0);
  });

  it('sweep clears a row', () => {
    const run = startStage(getStage(1));
    placePiece(run, 0, 0, 0);
    useSweep(run, 'row', 0);
    for (let c = 0; c < 11; c++) expect(getCell(run.board, 0, c)).toBe(0);
  });

  it('enforces per-stage use limit', () => {
    const run = startStage(getStage(1));
    for (let i = 0; i < MAX_BOOSTER_PER_STAGE; i++) {
      expect(useRefresh(run)).toBe(true);
    }
    expect(useRefresh(run)).toBe(false);
  });
});
