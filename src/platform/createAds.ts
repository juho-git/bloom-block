import { AD_CONFIG } from '../config/ads';
import { loadSave, updateSave } from '../services/save';
import type { AdsAdapter, PortalId } from './AdsAdapter';
import { DummyAds } from './DummyAds';
import { GdAds } from './GdAds';
import { PlaygamaAds } from './PlaygamaAds';
import { PokiAds } from './PokiAds';

let ads: AdsAdapter | null = null;
let lastRewardedAt = 0;

export function createAds(portal?: string): AdsAdapter {
  const id = (portal ?? import.meta.env.VITE_PORTAL ?? 'dummy') as PortalId;
  switch (id) {
    case 'poki':
      return new PokiAds();
    case 'gd':
      return new GdAds();
    case 'playgama':
      return new PlaygamaAds();
    default:
      return new DummyAds();
  }
}

export function getAds(): AdsAdapter {
  if (!ads) ads = createAds();
  return ads;
}

export async function initAds(): Promise<void> {
  const a = getAds();
  await a.init();
}

/** Interstitial eligibility per section 8 */
export function shouldShowInterstitial(stageId: number | null): boolean {
  const s = loadSave();
  if (stageId !== null && stageId < AD_CONFIG.interstitialMinStage) return false;
  const now = Date.now();
  if (now - s.ads.sessionStart < AD_CONFIG.firstSessionNoInterstitialSec * 1000) return false;
  if (now - s.ads.lastAdAt < AD_CONFIG.interstitialMinGapSec * 1000) return false;
  const next = s.ads.eligibleResults + 1;
  return next % AD_CONFIG.interstitialEveryNthResult === 0;
}

export async function maybeShowInterstitial(
  stageId: number | null,
  onPause: () => void,
  onResume: () => void,
): Promise<void> {
  updateSave((s) => {
    s.ads.eligibleResults += 1;
  });
  if (!shouldShowInterstitial(stageId)) return;
  onPause();
  try {
    await getAds().showInterstitial();
    updateSave((s) => {
      s.ads.lastAdAt = Date.now();
    });
  } finally {
    onResume();
  }
}

export async function showRewardedAd(
  onPause: () => void,
  onResume: () => void,
): Promise<boolean> {
  const now = Date.now();
  if (now - lastRewardedAt < AD_CONFIG.rewardedBoosterCooldownSec * 1000) {
    return false;
  }
  onPause();
  try {
    const r = await getAds().showRewarded();
    if (r === 'rewarded') {
      lastRewardedAt = Date.now();
      updateSave((s) => {
        s.ads.lastAdAt = Date.now();
      });
      return true;
    }
    return false;
  } finally {
    onResume();
  }
}
