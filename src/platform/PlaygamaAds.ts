import type { AdsAdapter } from './AdsAdapter';

/** Playgama Bridge SDK stub — verify ads API against current docs. */
export class PlaygamaAds implements AdsAdapter {
  async init(): Promise<void> {
    console.info('[PlaygamaAds] stub init');
  }
  async showInterstitial(): Promise<'shown' | 'failed' | 'skipped'> {
    console.info('[PlaygamaAds] stub interstitial');
    return 'skipped';
  }
  async showRewarded(): Promise<'rewarded' | 'failed' | 'skipped'> {
    console.info('[PlaygamaAds] stub rewarded');
    return 'skipped';
  }
  gameplayStart(): void {}
  gameplayStop(): void {}
}
