import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

import { APP_OPENS_KEY } from '@/app/_layout';

const REVIEW_STATE_KEY = '@app_review_state_v2';
const IOS_APP_ID = '6760221388';
const ANDROID_PACKAGE = 'com.realbarber.client';

const MIN_OPENS_FOR_PROFILE = 3;
const MIN_DAYS_BETWEEN_REQUESTS = 90;
const MAX_REQUESTS_PER_YEAR = 3;

type ReviewTrigger = 'booking_created' | 'profile';

interface ReviewState {
  year: number;
  requestCount: number;
  lastRequestAt: number | null;
}

let pendingAfterBooking = false;

export function setPendingStoreReviewAfterBooking(): void {
  pendingAfterBooking = true;
}

export function peekPendingStoreReviewAfterBooking(): boolean {
  return pendingAfterBooking;
}

export function consumePendingStoreReviewAfterBooking(): boolean {
  if (!pendingAfterBooking) return false;
  pendingAfterBooking = false;
  return true;
}

export function clearPendingStoreReviewAfterBooking(): void {
  pendingAfterBooking = false;
}

async function readReviewState(): Promise<ReviewState> {
  const currentYear = new Date().getFullYear();
  try {
    const raw = await AsyncStorage.getItem(REVIEW_STATE_KEY);
    if (!raw) return { year: currentYear, requestCount: 0, lastRequestAt: null };
    const parsed = JSON.parse(raw) as Partial<ReviewState>;
    const year = typeof parsed.year === 'number' ? parsed.year : currentYear;
    const requestCount = typeof parsed.requestCount === 'number' ? parsed.requestCount : 0;
    const lastRequestAt = typeof parsed.lastRequestAt === 'number' ? parsed.lastRequestAt : null;
    if (year !== currentYear) {
      return { year: currentYear, requestCount: 0, lastRequestAt: null };
    }
    return { year, requestCount, lastRequestAt };
  } catch {
    return { year: currentYear, requestCount: 0, lastRequestAt: null };
  }
}

async function writeReviewState(state: ReviewState): Promise<void> {
  await AsyncStorage.setItem(REVIEW_STATE_KEY, JSON.stringify(state)).catch(() => {});
}

function writeReviewUrl(): string | null {
  if (Platform.OS === 'ios') {
    return `https://apps.apple.com/app/apple-store/id${IOS_APP_ID}?action=write-review`;
  }
  if (Platform.OS === 'android') {
    return `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&showAllReviews=true`;
  }
  return null;
}

async function canRequestAgain(state: ReviewState): Promise<boolean> {
  if (state.requestCount >= MAX_REQUESTS_PER_YEAR) return false;
  if (state.lastRequestAt == null) return true;
  const elapsedMs = Date.now() - state.lastRequestAt;
  return elapsedMs >= MIN_DAYS_BETWEEN_REQUESTS * 24 * 60 * 60 * 1000;
}

async function markRequested(state: ReviewState): Promise<void> {
  await writeReviewState({
    year: state.year,
    requestCount: state.requestCount + 1,
    lastRequestAt: Date.now(),
  });
}

async function openStoreReviewFallback(): Promise<boolean> {
  const url = StoreReview.storeUrl() ?? writeReviewUrl();
  if (!url) return false;
  const canOpen = await Linking.canOpenURL(url).catch(() => false);
  if (!canOpen) return false;
  await Linking.openURL(url);
  return true;
}

/**
 * Požádá o hodnocení v App Store / Play Store.
 * Po úspěšné rezervaci volat s `booking_created` (bez limitu otevření appky).
 * Z profilu jen jako záloha (`profile`) po N otevřeních.
 */
export async function maybeRequestAppStoreReview(options?: {
  trigger?: ReviewTrigger;
  delayMs?: number;
}): Promise<void> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;

  const trigger = options?.trigger ?? 'profile';
  const delayMs = options?.delayMs ?? 800;

  const state = await readReviewState();
  if (!(await canRequestAgain(state))) return;

  if (trigger === 'profile') {
    const raw = await AsyncStorage.getItem(APP_OPENS_KEY).catch(() => null);
    const opens = parseInt(raw ?? '0', 10) || 0;
    if (opens < MIN_OPENS_FOR_PROFILE) return;
  }

  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  if (await StoreReview.isAvailableAsync()) {
    try {
      await StoreReview.requestReview();
      await markRequested(state);
      return;
    } catch {
      /* fallback níže */
    }
  }

  if (await StoreReview.hasAction()) {
    try {
      await StoreReview.requestReview();
      await markRequested(state);
      return;
    } catch {
      /* fallback níže */
    }
  }

  if (await openStoreReviewFallback()) {
    await markRequested(state);
  }
}
