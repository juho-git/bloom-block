import { loadSave } from './save';

type SfxId = 'place' | 'clear' | 'bloom' | 'win' | 'fail' | 'click';

let ctx: AudioContext | null = null;
let unlocked = false;
let bgmTimer: number | null = null;
let mutedByAd = false;
let mutedByHidden = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function unlockAudio(): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  unlocked = true;
  maybeStartBgm();
}

function canPlaySfx(): boolean {
  return unlocked && !mutedByAd && !mutedByHidden && loadSave().settings.sfx;
}

function canPlayBgm(): boolean {
  return unlocked && !mutedByAd && !mutedByHidden && loadSave().settings.bgm;
}

function beep(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.08): void {
  const c = getCtx();
  if (!c || !canPlaySfx()) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur);
}

export function playSfx(id: SfxId, combo = 1): void {
  switch (id) {
    case 'place':
      beep(440, 0.06, 'triangle', 0.06);
      break;
    case 'clear':
      beep(520 + combo * 40, 0.12, 'sine', 0.09);
      break;
    case 'bloom':
      beep(660, 0.08, 'sine');
      setTimeout(() => beep(880, 0.1, 'sine'), 60);
      break;
    case 'win':
      beep(523, 0.1);
      setTimeout(() => beep(659, 0.1), 100);
      setTimeout(() => beep(784, 0.18), 200);
      break;
    case 'fail':
      beep(200, 0.2, 'sawtooth', 0.05);
      break;
    case 'click':
      beep(700, 0.04, 'square', 0.04);
      break;
  }
}

function maybeStartBgm(): void {
  if (!canPlayBgm()) {
    stopBgm();
    return;
  }
  if (bgmTimer !== null) return;
  const loop = () => {
    if (!canPlayBgm()) return;
    const notes = [262, 330, 392, 330];
    notes.forEach((f, i) => {
      setTimeout(() => {
        if (!canPlayBgm()) return;
        const c = getCtx();
        if (!c) return;
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.value = 0.02;
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
        o.connect(g);
        g.connect(c.destination);
        o.start();
        o.stop(c.currentTime + 0.35);
      }, i * 400);
    });
  };
  loop();
  bgmTimer = window.setInterval(loop, 2000) as unknown as number;
}

export function stopBgm(): void {
  if (bgmTimer !== null) {
    clearInterval(bgmTimer);
    bgmTimer = null;
  }
}

export function setAdMuted(m: boolean): void {
  mutedByAd = m;
  if (m) stopBgm();
  else maybeStartBgm();
}

export function onVisibilityChange(): void {
  mutedByHidden = typeof document !== 'undefined' && document.hidden;
  if (mutedByHidden) stopBgm();
  else maybeStartBgm();
}

export function refreshAudioFromSettings(): void {
  if (!loadSave().settings.bgm) stopBgm();
  else maybeStartBgm();
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', onVisibilityChange);
}
