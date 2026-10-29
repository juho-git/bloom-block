import type { AdsAdapter } from './AdsAdapter';

/** GameDistribution stub — verify gdsdk.showAd against current docs. */
export class GdAds implements AdsAdapter {
  async init(): Promise<void> {
    console.info('[GdAds] stub init');
  }
  async showInterstitial(): Promise<'shown' | 'failed' | 'skipped'> {
    console.info('[GdAds] stub showAd interstitial');
    return 'skipped';
  }
  async showRewarded(): Promise<'rewarded' | 'failed' | 'skipped'> {
    console.info('[GdAds] stub showAd rewarded');
    return 'skipped';
  }
  gameplayStart(): void {}
  gameplayStop(): void {}
}
