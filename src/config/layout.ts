export const LOGICAL_W = 720;
export const LOGICAL_H = 1280;

export const CELL = 56;
export const BOARD_ORIGIN_X = 52;
export const BOARD_ORIGIN_Y = 230;
export const BOARD_SIZE = 11;

export const TRAY_CELL = 36;
export const TRAY_Y = 1020;
export const BOOSTER_Y = 900;

export const DRAG_OFFSET_Y = 100;

/**
 * Cozy garden palette — blush / peach / mint / sky / lavender on cream.
 * Block hues stay distinct for colorblind players; each color also has a glyph pattern.
 */
export const COLORS = {
  blush: 0xff8fab,
  peach: 0xffb38a,
  butter: 0xffd56b,
  mint: 0x7dceb8,
  sky: 0x7eb6e8,
  lavender: 0xb8a0e0,
  soil: 0xa67c68,
  cream: 0xfff4f0,
  creamDeep: 0xffe8e2,
  boardBg: 0xfff0ea,
  boardFrame: 0xf5c6b8,
  gridLine: 0xf0d0c6,
  text: 0x5a4450,
  accent: 0xf48fb1,
  leaf: 0x8fbc8f,
  gold: 0xffc857,
  white: 0xffffff,
} as const;

/** Block colors 1–5 (index 0 unused conceptually) */
export const BLOCK_COLORS = [
  COLORS.blush,
  COLORS.butter,
  COLORS.mint,
  COLORS.sky,
  COLORS.lavender,
] as const;

/** Darker rim for jelly shine */
export const BLOCK_RIMS = [0xe86a88, 0xe8b84a, 0x5aaa96, 0x5a92c8, 0x9178c8] as const;

/** Highlight for glossy top */
export const BLOCK_HILITES = [0xffc2d0, 0xffe9a8, 0xb8e8d8, 0xb0d4f5, 0xd4c4f0] as const;

/** Pattern id per block color for colorblind aid */
export type BlockPattern = 'heart' | 'stripe' | 'dot' | 'ring' | 'petal';

export const BLOCK_PATTERNS: BlockPattern[] = ['heart', 'stripe', 'dot', 'ring', 'petal'];
