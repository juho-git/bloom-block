import type { PieceDef, PieceInstance, ShapeGrid } from './types';
import shapesJson from '../data/shapes.json';

export const SHAPE_GROUPS = {
  dot: ['Dot'],
  line23: ['I2H', 'I2V', 'I3H', 'I3V'],
  line45: ['I4H', 'I4V', 'I5H', 'I5V'],
  square: ['O2'],
  rectLarge: ['R23', 'R32', 'O3'],
  smallL: ['L2a', 'L2b', 'L2c', 'L2d'],
  largeL: ['L3a', 'L3b', 'L3c', 'L3d'],
} as const;

export type ShapeGroup = keyof typeof SHAPE_GROUPS;

/** Weights per tier: [dot, line23, line45, square, rectLarge, smallL, largeL] */
export const TIER_WEIGHTS = {
  easy: [6, 10, 3, 6, 2, 8, 2],
  normal: [3, 8, 6, 6, 5, 7, 5],
  large: [1, 5, 8, 5, 9, 5, 9],
} as const;

const GROUP_ORDER: ShapeGroup[] = [
  'dot',
  'line23',
  'line45',
  'square',
  'rectLarge',
  'smallL',
  'largeL',
];

function parseShape(id: string, grid: ShapeGrid): PieceDef {
  const cells: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r]!;
    for (let c = 0; c < row.length; c++) {
      if (row[c] === '#') cells.push({ r, c });
    }
  }
  if (cells.length === 0) throw new Error(`Empty shape ${id}`);
  const height = grid.length;
  const width = Math.max(...grid.map((g) => g.length));
  return { id, cells, width, height, cellCount: cells.length };
}

export function loadShapes(
  raw: Record<string, ShapeGrid> = shapesJson as Record<string, ShapeGrid>,
): Map<string, PieceDef> {
  const map = new Map<string, PieceDef>();
  for (const [id, grid] of Object.entries(raw)) {
    map.set(id, parseShape(id, grid));
  }
  return map;
}

let cached: Map<string, PieceDef> | null = null;

export function getShapes(): Map<string, PieceDef> {
  if (!cached) cached = loadShapes();
  return cached;
}

export function makePiece(def: PieceDef, color: number): PieceInstance {
  return {
    shapeId: def.id,
    color,
    cells: def.cells.map((c) => ({ ...c })),
    width: def.width,
    height: def.height,
    cellCount: def.cellCount,
  };
}

export function pieceFromId(shapeId: string, color: number): PieceInstance {
  const def = getShapes().get(shapeId);
  if (!def) throw new Error(`Unknown shape ${shapeId}`);
  return makePiece(def, color);
}

export function allShapeIds(): string[] {
  return [...getShapes().keys()];
}

export function smallestShapeIds(n = 3): string[] {
  const defs = [...getShapes().values()].sort(
    (a, b) => a.cellCount - b.cellCount || a.id.localeCompare(b.id),
  );
  return defs.slice(0, n).map((d) => d.id);
}

export function pickGroupWeights(tier: keyof typeof TIER_WEIGHTS, occupancyBoost = false): number[] {
  const base = [...TIER_WEIGHTS[tier]];
  if (occupancyBoost) {
    // double small piece groups: dot, line23, smallL
    base[0]! *= 2;
    base[1]! *= 2;
    base[5]! *= 2;
  }
  return base;
}

export function groupForShape(shapeId: string): ShapeGroup | null {
  for (const g of GROUP_ORDER) {
    if ((SHAPE_GROUPS[g] as readonly string[]).includes(shapeId)) return g;
  }
  return null;
}

export { GROUP_ORDER };
