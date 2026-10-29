import { loadSave } from './save';

export function vibrate(pattern: number | number[] = 15): void {
  const s = loadSave();
  if (!s.settings.vibrate) return;
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore
  }
}

export const Haptic = {
  place: () => vibrate(12),
  clear: () => vibrate([10, 30, 10]),
  over: () => vibrate([40, 40, 40]),
  win: () => vibrate([20, 40, 20, 40, 20]),
  tap: () => vibrate(8),
};
