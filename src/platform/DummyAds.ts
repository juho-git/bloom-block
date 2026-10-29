import type { AdsAdapter } from './AdsAdapter';

/** No-op / mock ads for local MVP. Simulates short delay then success. */
export class DummyAds implements AdsAdapter {
  private playing = false;

  async init(): Promise<void> {
    // no-op
  }

  async showInterstitial(): Promise<'shown' | 'failed' | 'skipped'> {
    await delay(200);
    return 'shown';
  }

  async showRewarded(): Promise<'rewarded' | 'failed' | 'skipped'> {
    await delay(300);
    return 'rewarded';
  }

  gameplayStart(): void {
    this.playing = true;
  }

  gameplayStop(): void {
    this.playing = false;
  }

  isPlaying(): boolean {
    return this.playing;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
