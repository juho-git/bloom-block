import { canPlace, findPlacement, hasAnyMove, occupancyRatio } from './board';
import {
  GROUP_ORDER,
  SHAPE_GROUPS,
  getShapes,
  makePiece,
  pickGroupWeights,
  smallestShapeIds,
  type ShapeGroup,
} from './pieces';
import { mulberry32, pickUniform, pickWeighted, randInt } from './rng';
import type { BoardState, FairSpawn, PieceInstance, PieceTier } from './types';

export function createRng(seed: number): () => number {
  return mulberry32(seed);
}

function pickShapeId(rng: () => number, tier: PieceTier, board: BoardState): string {
  const boost = occupancyRatio(board) > 0.7;
  const weights = pickGroupWeights(tier, boost);
  const group = pickWeighted(rng, GROUP_ORDER, weights) as ShapeGroup;
  const ids = SHAPE_GROUPS[group] as readonly string[];
  return pickUniform(rng, ids);
}

function pickColor(rng: () => number): number {
  return randInt(rng, 1, 5);
}

export function spawnOne(rng: () => number, tier: PieceTier, board: BoardState): PieceInstance {
  const id = pickShapeId(rng, tier, board);
  const def = getShapes().get(id)!;
  return makePiece(def, pickColor(rng));
}

function canPlaceSomewhere(board: BoardState, piece: PieceInstance): boolean {
  return findPlacement(board, piece) !== null;
}

/** Check if there exists an order to place all non-null pieces (permutation) */
export function canPlaceAllInSomeOrder(
  board: BoardState,
  pieces: PieceInstance[],
): boolean {
  const alive = pieces.filter(Boolean);
  if (alive.length === 0) return true;

  function dfs(remaining: PieceInstance[], b: BoardState): boolean {
    if (remaining.length === 0) return true;
    for (let i = 0; i < remaining.length; i++) {
      const p = remaining[i]!;
      for (let r = 0; r < b.size; r++) {
        for (let c = 0; c < b.size; c++) {
          if (!canPlace(b, p, r, c)) continue;
          const next = { size: b.size, cells: b.cells.slice() };
          for (const cell of p.cells) {
            next.cells[(r + cell.r) * next.size + (c + cell.c)] = p.color;
          }
          const rest = remaining.slice(0, i).concat(remaining.slice(i + 1));
          if (dfs(rest, next)) return true;
        }
      }
    }
    return false;
  }

  return dfs(alive, board);
}

function satisfiesFair(
  board: BoardState,
  pieces: PieceInstance[],
  fair: FairSpawn,
): boolean {
  if (fair === 'off') return true;
  if (fair === 'atLeastOne') return hasAnyMove(board, pieces);
  return canPlaceAllInSomeOrder(board, pieces);
}

export function spawnTray(
  rng: () => number,
  board: BoardState,
  tier: PieceTier,
  fair: FairSpawn,
  maxAttempts = 20,
): PieceInstance[] {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pieces = [
      spawnOne(rng, tier, board),
      spawnOne(rng, tier, board),
      spawnOne(rng, tier, board),
    ];
    if (satisfiesFair(board, pieces, fair)) return pieces;
  }

  // Fallback: smallest shapes
  const ids = smallestShapeIds(3);
  const shapes = getShapes();
  return ids.map((id) => makePiece(shapes.get(id)!, pickColor(rng)));
}

export function endlessTier(score: number): PieceTier {
  if (score < 500) return 'easy';
  if (score < 2000) return 'normal';
  return 'large';
}

export { canPlaceSomewhere };
