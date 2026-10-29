import type { BoardState, Cell, PieceInstance } from './types';

export type { BoardState, Cell };

export const EMPTY = 0;
export const SEED = -1;

export function createBoard(size = 11, fill: Cell = EMPTY): BoardState {
  return { size, cells: Array(size * size).fill(fill) };
}

export function idx(board: BoardState, r: number, c: number): number {
  return r * board.size + c;
}

export function getCell(board: BoardState, r: number, c: number): Cell {
  if (r < 0 || c < 0 || r >= board.size || c >= board.size) return -99;
  return board.cells[idx(board, r, c)]!;
}

export function setCell(board: BoardState, r: number, c: number, v: Cell): void {
  board.cells[idx(board, r, c)] = v;
}

export function cloneBoard(board: BoardState): BoardState {
  return { size: board.size, cells: board.cells.slice() };
}

export function isEmpty(v: Cell): boolean {
  return v === EMPTY;
}

export function isSeed(v: Cell): boolean {
  return v === SEED;
}

export function isBlock(v: Cell): boolean {
  return v >= 1 && v <= 5;
}

export function isOccupied(v: Cell): boolean {
  return !isEmpty(v);
}

/** Parse board rows: `.` empty, `1`-`5` color, `s`/`S` seed */
export function parseBoard(rows: string[], size = 11): BoardState {
  if (rows.length !== size) {
    throw new Error(`Board must have ${size} rows, got ${rows.length}`);
  }
  const board = createBoard(size);
  for (let r = 0; r < size; r++) {
    const row = rows[r]!;
    if (row.length !== size) {
      throw new Error(`Row ${r} length ${row.length} != ${size}`);
    }
    for (let c = 0; c < size; c++) {
      const ch = row[c]!;
      if (ch === '.') setCell(board, r, c, EMPTY);
      else if (ch === 's' || ch === 'S') setCell(board, r, c, SEED);
      else if (ch >= '1' && ch <= '5') setCell(board, r, c, Number(ch));
      else throw new Error(`Invalid cell '${ch}' at ${r},${c}`);
    }
  }
  return board;
}

export function canPlace(
  board: BoardState,
  piece: PieceInstance,
  atR: number,
  atC: number,
): boolean {
  for (const { r, c } of piece.cells) {
    const rr = atR + r;
    const cc = atC + c;
    if (rr < 0 || cc < 0 || rr >= board.size || cc >= board.size) return false;
    if (!isEmpty(getCell(board, rr, cc))) return false;
  }
  return true;
}

export function place(
  board: BoardState,
  piece: PieceInstance,
  atR: number,
  atC: number,
): boolean {
  if (!canPlace(board, piece, atR, atC)) return false;
  for (const { r, c } of piece.cells) {
    setCell(board, atR + r, atC + c, piece.color);
  }
  return true;
}

export interface ClearedLines {
  rows: number[];
  cols: number[];
}

export function findClearedLines(board: BoardState): ClearedLines {
  const rows: number[] = [];
  const cols: number[] = [];
  for (let r = 0; r < board.size; r++) {
    let full = true;
    for (let c = 0; c < board.size; c++) {
      if (isEmpty(getCell(board, r, c))) {
        full = false;
        break;
      }
    }
    if (full) rows.push(r);
  }
  for (let c = 0; c < board.size; c++) {
    let full = true;
    for (let r = 0; r < board.size; r++) {
      if (isEmpty(getCell(board, r, c))) {
        full = false;
        break;
      }
    }
    if (full) cols.push(c);
  }
  return { rows, cols };
}

/** Returns number of seeds collected */
export function clearLines(board: BoardState, lines: ClearedLines): number {
  const toClear = new Set<number>();
  for (const r of lines.rows) {
    for (let c = 0; c < board.size; c++) toClear.add(idx(board, r, c));
  }
  for (const c of lines.cols) {
    for (let r = 0; r < board.size; r++) toClear.add(idx(board, r, c));
  }
  let seeds = 0;
  for (const i of toClear) {
    if (isSeed(board.cells[i]!)) seeds++;
    board.cells[i] = EMPTY;
  }
  return seeds;
}

/** Same-color bloom: a cleared line where all non-seed cells share one color (and at least one block). Seeds allowed. */
export function isBloomLine(board: BoardState, kind: 'row' | 'col', index: number): boolean {
  let color: number | null = null;
  for (let i = 0; i < board.size; i++) {
    const v = kind === 'row' ? getCell(board, index, i) : getCell(board, i, index);
    if (isSeed(v)) continue;
    if (!isBlock(v)) return false;
    if (color === null) color = v;
    else if (v !== color) return false;
  }
  return color !== null;
}

export function countBloomLines(board: BoardState, lines: ClearedLines): number {
  let n = 0;
  for (const r of lines.rows) if (isBloomLine(board, 'row', r)) n++;
  for (const c of lines.cols) if (isBloomLine(board, 'col', c)) n++;
  return n;
}

export function isBoardEmpty(board: BoardState): boolean {
  return board.cells.every(isEmpty);
}

export function occupancyRatio(board: BoardState): number {
  let occ = 0;
  for (const v of board.cells) if (!isEmpty(v)) occ++;
  return occ / board.cells.length;
}

export function hasAnyMove(board: BoardState, pieces: Array<PieceInstance | null>): boolean {
  for (const p of pieces) {
    if (!p) continue;
    for (let r = 0; r < board.size; r++) {
      for (let c = 0; c < board.size; c++) {
        if (canPlace(board, p, r, c)) return true;
      }
    }
  }
  return false;
}

export function findPlacement(
  board: BoardState,
  piece: PieceInstance,
): { r: number; c: number } | null {
  for (let r = 0; r < board.size; r++) {
    for (let c = 0; c < board.size; c++) {
      if (canPlace(board, piece, r, c)) return { r, c };
    }
  }
  return null;
}

/** Clear 3x3 around center; returns seeds gained */
export function clearBomb(board: BoardState, cr: number, cc: number): number {
  let seeds = 0;
  for (let r = cr - 1; r <= cr + 1; r++) {
    for (let c = cc - 1; c <= cc + 1; c++) {
      if (r < 0 || c < 0 || r >= board.size || c >= board.size) continue;
      const v = getCell(board, r, c);
      if (isSeed(v)) seeds++;
      setCell(board, r, c, EMPTY);
    }
  }
  return seeds;
}

/** Clear entire row or col; returns seeds gained */
export function clearSweep(
  board: BoardState,
  kind: 'row' | 'col',
  index: number,
): number {
  let seeds = 0;
  for (let i = 0; i < board.size; i++) {
    const r = kind === 'row' ? index : i;
    const c = kind === 'row' ? i : index;
    const v = getCell(board, r, c);
    if (isSeed(v)) seeds++;
    setCell(board, r, c, EMPTY);
  }
  return seeds;
}

/** Clear fullest 3 rows (for revive) */
export function clearFullestRows(board: BoardState, count = 3): number {
  const fullness: Array<{ r: number; n: number }> = [];
  for (let r = 0; r < board.size; r++) {
    let n = 0;
    for (let c = 0; c < board.size; c++) {
      if (!isEmpty(getCell(board, r, c))) n++;
    }
    fullness.push({ r, n });
  }
  fullness.sort((a, b) => b.n - a.n);
  let seeds = 0;
  for (let i = 0; i < count && i < fullness.length; i++) {
    seeds += clearSweep(board, 'row', fullness[i]!.r);
  }
  return seeds;
}

export function boardHasCompletedLine(board: BoardState): boolean {
  const lines = findClearedLines(board);
  return lines.rows.length > 0 || lines.cols.length > 0;
}
