import { describe, expect, it } from 'vitest';
import { goalProgress, validateStageData } from '../src/core/goals';
import { getStage } from '../src/data/stages';

describe('goals & stage loader', () => {
  it('loads stage 1', () => {
    const s = getStage(1);
    expect(s.id).toBe(1);
    expect(s.size).toBe(11);
  });

  it('rejects board with completed line', () => {
    expect(() =>
      validateStageData({
        id: 99,
        mode: 'stage',
        seed: 1,
        size: 11,
        board: Array.from({ length: 11 }, (_, r) =>
          r === 0 ? '11111111111' : '...........',
        ),
        goals: [{ type: 'score', target: 100 }],
        pieceTier: 'easy',
        fairSpawn: 'all',
        stars: { three: 10, two: 20 },
        rewards: { coins: 10 },
      }),
    ).toThrow(/completed line/);
  });

  it('rejects bad size', () => {
    expect(() =>
      validateStageData({
        id: 1,
        mode: 'stage',
        seed: 1,
        size: 8,
        board: [],
        goals: [],
        pieceTier: 'easy',
        fairSpawn: 'all',
        stars: { three: 1, two: 2 },
        rewards: { coins: 1 },
      }),
    ).toThrow(/size/);
  });

  it('rejects missing score target', () => {
    expect(() =>
      validateStageData({
        id: 1,
        mode: 'stage',
        seed: 1,
        size: 11,
        board: Array.from({ length: 11 }, () => '...........'),
        goals: [{ type: 'score' }],
        pieceTier: 'easy',
        fairSpawn: 'all',
        stars: { three: 1, two: 2 },
        rewards: { coins: 1 },
      }),
    ).toThrow(/target/);
  });

  it('goal progress requires both goals', () => {
    const g = goalProgress(
      [
        { type: 'seeds', count: 2 },
        { type: 'score', target: 100 },
      ],
      100,
      1,
    );
    expect(g.won).toBe(false);
    expect(goalProgress([{ type: 'score', target: 100 }], 100, 0).won).toBe(true);
  });
});
