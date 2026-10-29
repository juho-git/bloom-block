/** Cell: 0 empty, 1-5 colored blocks, -1 seed (soil) */
export type Cell = number;

export type ShapeGrid = string[];

export interface PieceDef {
  id: string;
  cells: Array<{ r: number; c: number }>;
  width: number;
  height: number;
  cellCount: number;
}

export interface PieceInstance {
  shapeId: string;
  color: number; // 1-5
  cells: Array<{ r: number; c: number }>;
  width: number;
  height: number;
  cellCount: number;
}

export type FairSpawn = 'all' | 'atLeastOne' | 'off';
export type PieceTier = 'easy' | 'normal' | 'large';

export interface StageGoal {
  type: 'seeds' | 'score';
  count?: number;
  target?: number;
}

export interface StageData {
  id: number;
  mode: 'stage' | 'endless' | 'daily';
  seed: number;
  size: number;
  board: string[];
  goals: StageGoal[];
  pieceTier: PieceTier;
  fairSpawn: FairSpawn;
  stars: { three: number; two: number };
  rewards: { coins: number; boosterDrop?: string | null };
}

export interface ScoreBreakdown {
  place: number;
  lines: number;
  bloom: number;
  perfect: number;
  total: number;
  comboMultiplier: number;
  linesCleared: number;
  bloomLines: number;
  seedsGained: number;
  comboAfter: number;
}

export interface BoardState {
  size: number;
  cells: Cell[];
}

export type BoosterId = 'undo' | 'refresh' | 'bomb' | 'sweep';
