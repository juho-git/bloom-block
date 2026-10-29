import type { BoosterId } from '../core/types';

export const SAVE_KEY = 'bloomblocks.save.v1';

export interface GardenPlot {
  type: string;
  grow: number; // 0 planted, 1-2 growing, 3 bloomed (cleared to catalog)
}

export interface SaveData {
  v: number;
  coins: number;
  boosters: Record<BoosterId, number>;
  stage: { cleared: number; stars: Record<string, number> };
  endless: { best: number; runs: number };
  garden: { seeds: Record<string, number>; plots: Array<GardenPlot | null>; catalog: string[] };
  ads: { lastAdAt: number; eligibleResults: number; sessionStart: number };
  settings: { sfx: boolean; bgm: boolean; vibrate: boolean; lang: 'ko' | 'en' };
  daily: { lastLogin: string; streak: number };
  tutorial: { stage1: boolean; stage2: boolean };
}

export function defaultSave(): SaveData {
  return {
    v: 1,
    coins: 0,
    boosters: { undo: 2, refresh: 2, bomb: 2, sweep: 2 },
    stage: { cleared: 0, stars: {} },
    endless: { best: 0, runs: 0 },
    garden: { seeds: {}, plots: Array(12).fill(null), catalog: [] },
    ads: { lastAdAt: 0, eligibleResults: 0, sessionStart: Date.now() },
    settings: { sfx: true, bgm: true, vibrate: true, lang: 'ko' },
    daily: { lastLogin: '', streak: 0 },
    tutorial: { stage1: false, stage2: false },
  };
}

let memoryFallback: SaveData | null = null;
let useMemory = false;

function migrate(raw: SaveData): SaveData {
  const base = defaultSave();
  if (!raw || typeof raw !== 'object') return base;
  if (raw.v !== 1) {
    // future migrations
    return { ...base, ...raw, v: 1 };
  }
  return {
    ...base,
    ...raw,
    boosters: { ...base.boosters, ...raw.boosters },
    stage: { ...base.stage, ...raw.stage, stars: { ...raw.stage?.stars } },
    endless: { ...base.endless, ...raw.endless },
    garden: {
      ...base.garden,
      ...raw.garden,
      seeds: { ...raw.garden?.seeds },
      plots: raw.garden?.plots?.length === 12 ? raw.garden.plots : base.garden.plots,
      catalog: raw.garden?.catalog ?? [],
    },
    ads: { ...base.ads, ...raw.ads },
    settings: { ...base.settings, ...raw.settings },
    daily: { ...base.daily, ...raw.daily },
    tutorial: { ...base.tutorial, ...raw.tutorial },
  };
}

export function loadSave(): SaveData {
  if (useMemory) return memoryFallback ?? defaultSave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    return migrate(JSON.parse(raw) as SaveData);
  } catch {
    useMemory = true;
    memoryFallback = defaultSave();
    return memoryFallback;
  }
}

export function writeSave(data: SaveData): void {
  if (useMemory) {
    memoryFallback = data;
    return;
  }
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    useMemory = true;
    memoryFallback = data;
  }
}

export function updateSave(mutator: (s: SaveData) => void): SaveData {
  const s = loadSave();
  mutator(s);
  writeSave(s);
  return s;
}

export function isStageUnlocked(save: SaveData, stageId: number): boolean {
  return stageId === 1 || stageId <= save.stage.cleared + 1;
}

export function recordStageClear(
  stageId: number,
  stars: number,
  coinsEarned: number,
  seedsEarned: number,
  boosterDrop: string | null,
): SaveData {
  return updateSave((s) => {
    s.coins += coinsEarned;
    if (stageId > s.stage.cleared) s.stage.cleared = stageId;
    const prev = s.stage.stars[String(stageId)] ?? 0;
    if (stars > prev) s.stage.stars[String(stageId)] = stars;
    if (boosterDrop && boosterDrop in s.boosters) {
      s.boosters[boosterDrop as BoosterId] += 1;
    }
    // grow garden plots
    for (let i = 0; i < s.garden.plots.length; i++) {
      const p = s.garden.plots[i];
      if (!p) continue;
      if (p.grow < 3) p.grow += 1;
      if (p.grow >= 3) {
        s.coins += 50;
        if (!s.garden.catalog.includes(p.type)) s.garden.catalog.push(p.type);
        s.garden.plots[i] = null;
      }
    }
    // add generic seed stock from stage seeds
    if (seedsEarned > 0) {
      const types = ['rose', 'sunflower', 'mint', 'sky', 'lavender'];
      const pick = types[stageId % types.length]!;
      s.garden.seeds[pick] = (s.garden.seeds[pick] ?? 0) + seedsEarned;
    }
  });
}

export function recordEndless(score: number): SaveData {
  return updateSave((s) => {
    s.endless.runs += 1;
    if (score > s.endless.best) s.endless.best = score;
  });
}
