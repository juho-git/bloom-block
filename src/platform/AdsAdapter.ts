export interface AdsAdapter {
  init(): Promise<void>;
  showInterstitial(): Promise<'shown' | 'failed' | 'skipped'>;
  showRewarded(): Promise<'rewarded' | 'failed' | 'skipped'>;
  gameplayStart(): void;
  gameplayStop(): void;
}

export type PortalId = 'dummy' | 'poki' | 'gd' | 'playgama';
