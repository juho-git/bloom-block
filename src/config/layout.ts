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

export const COLORS = {
  coral: 0xff8a80,
  lemon: 0xffe082,
  mint: 0x80cbc4,
  sky: 0x81d4fa,
  lavender: 0xb39ddb,
  soil: 0x8d6e63,
  cream: 0xfff8e1,
  boardBg: 0xffecb3,
  gridLine: 0xe0c878,
  text: 0x5d4037,
  accent: 0x66bb6a,
} as const;

export const BLOCK_COLORS = [
  COLORS.coral,
  COLORS.lemon,
  COLORS.mint,
  COLORS.sky,
  COLORS.lavender,
] as const;
