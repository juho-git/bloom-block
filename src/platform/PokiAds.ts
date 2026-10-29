import type { AdsAdapter } from './AdsAdapter';

/**
 * Poki SDK stub — real API not wired (verify current docs before enabling).
 * Falls back to Dummy-like behavior so builds with VITE_PORTAL=poki still run.
 */
export class PokiAds implements AdsAdapter {
  async init(): Promise<void> {
    console.info('[PokiAds] stub init — replace with verified PokiSDK calls');
  }
  async showInterstitial(): Promise<'shown' | 'failed' | 'skipped'> {
    console.info('[PokiAds] stub commercialBreak');
    return 'skipped';
  }
  async showRewarded(): Promise<'rewarded' | 'failed' | 'skipped'> {
    console.info('[PokiAds] stub rewardedBreak');
    return 'skipped';
  }
  gameplayStart(): void {
    console.info('[PokiAds] stub gameplayStart');
  }
  gameplayStop(): void {
    console.info('[PokiAds] stub gameplayStop');
  }
}
