import {
  boardHasCompletedLine,
  parseBoard,
  type BoardState,
} from './board';
import { starsForPlacements } from './scoring';
import type { FairSpawn, PieceTier, StageData, StageGoal } from './types';

export interface GoalProgress {
  score: number;
  seeds: number;
  scoreTarget: number | null;
  seedsTarget: number | null;
  won: boolean;
}

export function goalProgress(
  goals: StageGoal[],
  score: number,
  seeds: number,
): GoalProgress {
  let scoreTarget: number | null = null;
  let seedsTarget: number | null = null;
  for (const g of goals) {
    if (g.type === 'score') scoreTarget = g.target ?? 0;
    if (g.type === 'seeds') seedsTarget = g.count ?? 0;
  }
  const scoreOk = scoreTarget === null || score >= scoreTarget;
  const seedsOk = seedsTarget === null || seeds >= seedsTarget;
  return {
    score,
    seeds,
    scoreTarget,
    seedsTarget,
    won: scoreOk && seedsOk && (scoreTarget !== null || seedsTarget !== null),
  };
}

export function validateStageData(raw: unknown): StageData {
  if (!raw || typeof raw !== 'object') throw new Error('Stage must be an object');
  const o = raw as Record<string, unknown>;

  if (typeof o.id !== 'number') throw new Error('Stage.id must be a number');
  if (o.mode !== 'stage' && o.mode !== 'endless' && o.mode !== 'daily') {
    throw new Error('Stage.mode invalid');
  }
  if (typeof o.seed !== 'number') throw new Error('Stage.seed must be a number');
  if (typeof o.size !== 'number' || o.size !== 11) {
    throw new Error('Stage.size must be 11');
  }
  if (!Array.isArray(o.board) || o.board.length !== 11) {
    throw new Error('Stage.board must be 11 strings');
  }
  for (let i = 0; i < o.board.length; i++) {
    if (typeof o.board[i] !== 'string' || (o.board[i] as string).length !== 11) {
      throw new Error(`Stage.board[${i}] must be length-11 string`);
    }
  }
  if (!Array.isArray(o.goals)) throw new Error('Stage.goals must be array');
  for (const g of o.goals as StageGoal[]) {
    if (g.type !== 'seeds' && g.type !== 'score') {
      throw new Error(`Unknown goal type ${String((g as StageGoal).type)}`);
    }
    if (g.type === 'seeds' && typeof g.count !== 'number') {
      throw new Error('seeds goal needs count');
    }
    if (g.type === 'score' && typeof g.target !== 'number') {
      throw new Error('score goal needs target');
    }
  }
  const tier = o.pieceTier;
  if (tier !== 'easy' && tier !== 'normal' && tier !== 'large') {
    throw new Error('pieceTier invalid');
  }
  const fair = o.fairSpawn;
  if (fair !== 'all' && fair !== 'atLeastOne' && fair !== 'off') {
    throw new Error('fairSpawn invalid');
  }
  const stars = o.stars as { three?: number; two?: number } | undefined;
  if (!stars || typeof stars.three !== 'number' || typeof stars.two !== 'number') {
    throw new Error('stars.three/two required');
  }
  const rewards = o.rewards as { coins?: number; boosterDrop?: string | null } | undefined;
  if (!rewards || typeof rewards.coins !== 'number') {
    throw new Error('rewards.coins required');
  }

  const board = parseBoard(o.board as string[], 11);
  if (boardHasCompletedLine(board)) {
    throw new Error(`Stage ${o.id}: starting board already has a completed line`);
  }

  return {
    id: o.id,
    mode: o.mode,
    seed: o.seed,
    size: o.size,
    board: o.board as string[],
    goals: o.goals as StageGoal[],
    pieceTier: tier,
    fairSpawn: fair as FairSpawn,
    stars: { three: stars.three, two: stars.two },
    rewards: { coins: rewards.coins, boosterDrop: rewards.boosterDrop ?? null },
  };
}

export function loadStageBoard(stage: StageData): BoardState {
  return parseBoard(stage.board, stage.size);
}

export function computeStars(stage: StageData, placements: number): 1 | 2 | 3 {
  return starsForPlacements(placements, stage.stars);
}

export function isValidPieceTier(t: string): t is PieceTier {
  return t === 'easy' || t === 'normal' || t === 'large';
}
