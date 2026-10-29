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
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

/** Soft sine with gentle attack — cozy, not buzzy */
function softTone(
  freq: number,
  dur: number,
  gain = 0.06,
  type: OscillatorType = 'sine',
): void {
  const c = getCtx();
  if (!c || !canPlaySfx()) return;
  const o = c.createOscillator();
  const g = c.createGain();
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 2400;
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime);
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(f);
  f.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur + 0.02);
}

function chord(freqs: number[], dur: number, gain = 0.04): void {
  freqs.forEach((f, i) => softTone(f, dur, gain * (1 - i * 0.15)));
}

export function playSfx(id: SfxId, combo = 1): void {
  switch (id) {
    case 'place':
      softTone(523.25, 0.08, 0.045, 'triangle');
      softTone(659.25, 0.1, 0.03, 'sine');
      break;
    case 'clear': {
      const base = 523.25 + Math.min(combo, 5) * 40;
      softTone(base, 0.12, 0.055);
      softTone(base * 1.25, 0.16, 0.04);
      break;
    }
    case 'bloom':
      softTone(659.25, 0.1, 0.05);
      setTimeout(() => softTone(783.99, 0.12, 0.045), 70);
      setTimeout(() => softTone(987.77, 0.16, 0.035), 140);
      break;
    case 'win':
      chord([523.25, 659.25, 783.99], 0.22, 0.05);
      setTimeout(() => softTone(1046.5, 0.28, 0.045), 180);
      break;
    case 'fail':
      softTone(311.13, 0.18, 0.04, 'triangle');
      setTimeout(() => softTone(246.94, 0.28, 0.035, 'triangle'), 100);
      break;
    case 'click':
      softTone(880, 0.045, 0.03, 'sine');
      break;
  }
}

function maybeStartBgm(): void {
  if (!canPlayBgm()) {
    stopBgm();
    return;
  }
  if (bgmTimer !== null) return;
  // gentle pentatonic lullaby loop
  const notes = [261.63, 293.66, 329.63, 392.0, 329.63, 293.66];
  const loop = () => {
    if (!canPlayBgm()) return;
    notes.forEach((f, i) => {
      setTimeout(() => {
        if (!canPlayBgm()) return;
        const c = getCtx();
        if (!c) return;
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.018, c.currentTime + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.5);
        o.connect(g);
        g.connect(c.destination);
        o.start();
        o.stop(c.currentTime + 0.52);
      }, i * 520);
    });
  };
  loop();
  bgmTimer = window.setInterval(loop, notes.length * 520 + 400) as unknown as number;
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
