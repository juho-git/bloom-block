/**
 * MVP stages 1–30 — tuned for reachable seed/score goals.
 * Run: npx tsx tools/gen-stages.ts
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, '../src/data/stages');

function round50(n: number): number {
  return Math.round(n / 50) * 50;
}

function emptyBoard(): string[] {
  return Array.from({ length: 11 }, () => '.'.repeat(11));
}

function setCell(board: string[], r: number, c: number, ch: string): void {
  const row = board[r]!.split('');
  row[c] = ch;
  board[r] = row.join('');
}

function countFilled(board: string[]): number {
  let n = 0;
  for (const row of board) for (const ch of row) if (ch !== '.') n++;
  return n;
}

function countSeeds(board: string[]): number {
  let n = 0;
  for (const row of board) for (const ch of row) if (ch === 's') n++;
  return n;
}

function hasFullLine(board: string[]): boolean {
  for (let r = 0; r < 11; r++) {
    if ([...board[r]!].every((c) => c !== '.')) return true;
  }
  for (let c = 0; c < 11; c++) {
    let full = true;
    for (let r = 0; r < 11; r++) if (board[r]![c] === '.') full = false;
    if (full) return true;
  }
  return false;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Near-complete row with a seed — easy first clears */
function addAlmostRow(board: string[], r: number, gaps: number[], seedCol: number, color: string): void {
  for (let c = 0; c < 11; c++) {
    if (gaps.includes(c)) continue;
    setCell(board, r, c, c === seedCol ? 's' : color);
  }
}

function sprinkle(board: string[], count: number, seed: number): void {
  const rng = mulberry32(seed);
  let placed = 0;
  let attempts = 0;
  while (placed < count && attempts < 8000) {
    attempts++;
    const r = Math.floor(rng() * 11);
    const c = Math.floor(rng() * 11);
    if (board[r]![c] !== '.') continue;
    const rowFill = [...board[r]!].filter((x) => x !== '.').length;
    let colFill = 0;
    for (let i = 0; i < 11; i++) if (board[i]![c] !== '.') colFill++;
    if (rowFill >= 8 || colFill >= 8) continue;
    setCell(board, r, c, String(1 + Math.floor(rng() * 5)));
    if (hasFullLine(board)) {
      setCell(board, r, c, '.');
      continue;
    }
    placed++;
  }
}

function ensureSeeds(board: string[], need: number, seed: number): void {
  if (need <= 0) return;
  const rng = mulberry32(seed ^ 0x55);
  let have = countSeeds(board);
  let attempts = 0;
  while (have < need && attempts < 3000) {
    attempts++;
    const r = Math.floor(rng() * 11);
    const c = Math.floor(rng() * 11);
    if (board[r]![c] !== '.') continue;
    setCell(board, r, c, 's');
    if (hasFullLine(board)) {
      setCell(board, r, c, '.');
      continue;
    }
    have++;
  }
}

type Curve = {
  fill: number;
  seedGoal: number;
  tier: 'easy' | 'normal' | 'large';
  fair: 'all' | 'atLeastOne';
  almostRows: number;
};

function curveFor(n: number): Curve {
  if (n === 1) return { fill: 0, seedGoal: 0, tier: 'easy', fair: 'all', almostRows: 0 };
  if (n === 2) return { fill: 0, seedGoal: 1, tier: 'easy', fair: 'all', almostRows: 1 };
  if (n <= 5) return { fill: 2 + n, seedGoal: n === 4 ? 1 : 0, tier: 'easy', fair: 'all', almostRows: 1 };
  if (n <= 10) return { fill: 6 + (n - 6), seedGoal: 2, tier: 'easy', fair: 'all', almostRows: 1 };
  if (n <= 20) return { fill: 10 + Math.floor((n - 11) / 2), seedGoal: 3, tier: 'normal', fair: 'atLeastOne', almostRows: 2 };
  // MVP: keep mid-late playable; weight large pieces only near the boss
  if (n <= 25) return { fill: 12 + (n - 21), seedGoal: 3, tier: 'normal', fair: 'atLeastOne', almostRows: 2 };
  if (n <= 29) return { fill: 14 + (n - 26), seedGoal: 4, tier: 'large', fair: 'atLeastOne', almostRows: 2 };
  return { fill: 18, seedGoal: 5, tier: 'large', fair: 'atLeastOne', almostRows: 2 };
}

mkdirSync(outDir, { recursive: true });

for (let n = 1; n <= 30; n++) {
  const curve = curveFor(n);
  const isBonus = n % 5 === 0 && n !== 30;
  // gentler score curve so greedy/human can finish
  const scoreTarget = isBonus
    ? round50(180 + 25 * (n - 1))
    : round50(220 + 28 * (n - 1));

  const board = emptyBoard();
  const rng = mulberry32(100000 + n * 97);

  if (n === 2) {
    addAlmostRow(board, 5, [10], 5, '1');
  } else if (n > 2) {
    for (let a = 0; a < curve.almostRows; a++) {
      const r = (2 + a * 3 + n) % 10;
      const gap = 9 - (n % 3);
      const seedCol = Math.min(8, 2 + a * 2);
      const color = String(1 + ((n + a) % 5));
      addAlmostRow(board, r, [gap, (gap + 1) % 11].slice(0, 1 + (n % 2 === 0 ? 0 : 0)), seedCol, color);
      // ensure not full
      if (hasFullLine(board)) {
        setCell(board, r, gap, '.');
      }
    }
    sprinkle(board, Math.max(0, curve.fill - countFilled(board)), 200000 + n);
  }

  ensureSeeds(board, curve.seedGoal, 300000 + n);

  // safety: no completed lines
  if (hasFullLine(board)) {
    for (let r = 0; r < 11; r++) {
      for (let c = 0; c < 11; c++) {
        if (board[r]![c] !== '.') {
          const tmp = board[r]![c]!;
          setCell(board, r, c, '.');
          if (!hasFullLine(board)) break;
          setCell(board, r, c, tmp);
        }
      }
      if (!hasFullLine(board)) break;
    }
  }

  const goals: Array<{ type: string; count?: number; target?: number }> = [];
  if (curve.seedGoal > 0) goals.push({ type: 'seeds', count: curve.seedGoal });
  goals.push({ type: 'score', target: scoreTarget });

  const three = 10 + Math.floor(n * 0.5);
  const two = three + 10 + Math.floor(n * 0.25);

  const stage = {
    id: n,
    mode: 'stage',
    seed: 120000 + n * 13,
    size: 11,
    board,
    goals,
    pieceTier: curve.tier,
    fairSpawn: curve.fair,
    stars: { three, two },
    rewards: {
      coins: 20 + (isBonus ? 20 : 0),
      boosterDrop: isBonus
        ? (['undo', 'refresh', 'bomb', 'sweep'] as const)[(n / 5 - 1) % 4]
        : null,
    },
  };

  if (hasFullLine(board)) {
    console.error('Full line in stage', n, board);
    process.exit(1);
  }
  if (countSeeds(board) < curve.seedGoal) {
    console.error('Not enough seeds', n, countSeeds(board), curve.seedGoal);
    process.exit(1);
  }

  const path = join(outDir, `stage-${String(n).padStart(3, '0')}.json`);
  writeFileSync(path, JSON.stringify(stage, null, 2) + '\n');
  console.log(
    `stage ${n}: fill=${countFilled(board)} seeds=${countSeeds(board)} goalSeeds=${curve.seedGoal} score=${scoreTarget} tier=${curve.tier}`,
  );
  void rng;
}

console.log('Wrote 30 stages to', outDir);
