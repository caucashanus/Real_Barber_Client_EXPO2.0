import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { getBookings, type Booking } from '@/api/bookings';
import { useAccentColor } from '@/app/contexts/AccentColorContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import {
  rbLiveActivityCleanup,
  rbLiveActivityMinutesDisplayed,
  rbLiveActivityUpdateForBooking,
} from '@/lib/rb-live-activity';

const RB_LIVE_ACTIVITY_BOOKINGS_CACHE_KEY = 'rb_live_activity_bookings_cache_v1';
const RB_RESCHEDULE_HINT_KEY = 'rb_live_activity_reschedule_hint_v1';

type CachedBooking = Pick<
  Booking,
  'id' | 'status' | 'date' | 'slotStart' | 'slotEnd' | 'price' | 'branch' | 'employee'
>;

function toCachedBooking(b: Booking): CachedBooking {
  return {
    id: b.id,
    status: b.status,
    date: b.date,
    slotStart: b.slotStart,
    slotEnd: b.slotEnd,
    price: b.price,
    branch: b.branch,
    employee: b.employee,
  };
}

async function readCachedBookings(): Promise<CachedBooking[]> {
  try {
    const raw = await AsyncStorage.getItem(RB_LIVE_ACTIVITY_BOOKINGS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as CachedBooking[]) : [];
  } catch {
    return [];
  }
}

async function writeCachedBookings(bookings: Booking[]): Promise<void> {
  try {
    const payload = bookings.slice(0, 30).map(toCachedBooking);
    await AsyncStorage.setItem(RB_LIVE_ACTIVITY_BOOKINGS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

type RescheduleHint = {
  bookingId: string;
  startAt: string;
  endAt: string;
  ts: number;
  branchName?: string;
  employeeName?: string;
  employeeAvatarUrl?: string;
  price?: number | null;
  detailLine?: string;
};

async function readRescheduleHint(): Promise<RescheduleHint | null> {
  try {
    const raw = await AsyncStorage.getItem(RB_RESCHEDULE_HINT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RescheduleHint>;
    if (!parsed.bookingId || !parsed.startAt || !parsed.endAt || !parsed.ts) return null;
    if (Date.now() - Number(parsed.ts) > 10 * 60_000) return null; // stale
    return parsed as RescheduleHint;
  } catch {
    return null;
  }
}

async function clearRescheduleHint(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RB_RESCHEDULE_HINT_KEY);
  } catch {
    // ignore
  }
}

async function reconcileFromBookings(
  apiToken: string,
  bookings: Booking[],
  t: (key: any) => string,
  locale: string,
  accentColor: string
): Promise<void> {
  const current = bookings.find(isBookingCurrent) ?? null;
  const upcomingInHour =
    bookings
      .filter(isBookingUpcoming)
      .map((b) => ({ b, t: getTargetDate(b).getTime() }))
      .filter(({ t: ts }) => ts - Date.now() <= 60 * 60_000 && ts - Date.now() > 0)
      .sort((a, c) => a.t - c.t)[0]?.b ?? null;

  const target = current ?? upcomingInHour;
  if (!target) {
    await rbLiveActivityCleanup([]);
    return;
  }

  const start = getTargetDate(target);
  const end = getBookingEndDate(target);
  const startMs = start.getTime();
  const endMs = end.getTime();
  const isCurrentNow = isBookingCurrent(target);

  const subtitle = isCurrentNow ? t('liveActivityEndsInLabel') : t('liveActivityStartsInLabel');
  const minutes = rbLiveActivityMinutesDisplayed(Date.now(), isCurrentNow ? endMs : startMs);
  const title = `${minutes} ${t('tripsMinutes')}`;
  const slotMs = Math.max(60_000, endMs - startMs);
  const progress01 = isCurrentNow
    ? clamp01((Date.now() - startMs) / slotMs)
    : clamp01(1 - (startMs - Date.now()) / (60 * 60 * 1000));

  await rbLiveActivityUpdateForBooking(target.id, {
    subtitle,
    title,
    detailLine: `${target.slotStart}–${target.slotEnd}`,
    branchName: target.branch?.name ?? '',
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    employeeName: target.employee?.name ?? '',
    employeeAvatarUrl: target.employee?.avatarUrl ?? '',
    employeeAvatarAuthToken: apiToken,
    priceFormatted: formatLiveActivityPrice(target, locale),
    progress01,
    accentHex: accentColor,
  });

  await rbLiveActivityCleanup([target.id]);
}

function bookingStatusKey(booking: Booking): string {
  return String(booking.status ?? '')
    .trim()
    .toLowerCase();
}

function isBookingCancelled(booking: Booking): boolean {
  const status = bookingStatusKey(booking);
  return status === 'cancelled' || status === 'canceled';
}

function isBookingCompleted(booking: Booking): boolean {
  return bookingStatusKey(booking) === 'completed';
}

function getTargetDate(booking: Booking): Date {
  const dateStr = (booking.date || '').slice(0, 10);
  const [y, m, d] = dateStr.split('-').map(Number);
  const parts = (booking.slotStart || '00:00').trim().split(':');
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  return new Date(
    Number.isFinite(y) ? y : 0,
    Number.isFinite(m) ? m - 1 : 0,
    Number.isFinite(d) ? d : 1,
    Number.isFinite(hh) ? hh : 0,
    Number.isFinite(mm) ? mm : 0,
    0,
    0
  );
}

function getBookingEndDate(booking: Booking): Date {
  const dateStr = (booking.date || '').slice(0, 10);
  const [y, m, d] = dateStr.split('-').map(Number);
  const parts = (booking.slotEnd || booking.slotStart || '00:00').trim().split(':');
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  return new Date(
    Number.isFinite(y) ? y : 0,
    Number.isFinite(m) ? m - 1 : 0,
    Number.isFinite(d) ? d : 1,
    Number.isFinite(hh) ? hh : 0,
    Number.isFinite(mm) ? mm : 0,
    0,
    0
  );
}

function isBookingCurrent(booking: Booking): boolean {
  if (isBookingCancelled(booking)) return false;
  if (isBookingCompleted(booking)) return false;
  const now = Date.now();
  const start = getTargetDate(booking).getTime();
  const end = getBookingEndDate(booking).getTime();
  return start <= now && end >= now;
}

function isBookingUpcoming(booking: Booking): boolean {
  if (isBookingCancelled(booking)) return false;
  if (isBookingCompleted(booking)) return false;
  return getTargetDate(booking).getTime() > Date.now();
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function formatLiveActivityPrice(booking: Booking, locale: string): string {
  const n = Number(booking.price);
  if (!Number.isFinite(n)) return '';
  const loc = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  return new Intl.NumberFormat(loc, {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

async function reconcileFromRescheduleHint(
  apiToken: string,
  hint: RescheduleHint,
  t: (key: any) => string,
  locale: string,
  accentColor: string
): Promise<'done' | 'skip'> {
  const start = new Date(hint.startAt);
  const end = new Date(hint.endAt);
  const startMs = start.getTime();
  const endMs = end.getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return 'skip';

  const diff = startMs - Date.now();
  if (diff > 60 * 60_000) {
    await rbLiveActivityCleanup([]);
    return 'done';
  }

  const isCurrentNow = startMs <= Date.now() && endMs >= Date.now();
  const subtitle = isCurrentNow ? t('liveActivityEndsInLabel') : t('liveActivityStartsInLabel');
  const minutes = rbLiveActivityMinutesDisplayed(Date.now(), isCurrentNow ? endMs : startMs);
  const title = `${minutes} ${t('tripsMinutes')}`;
  const slotMs = Math.max(60_000, endMs - startMs);
  const progress01 = isCurrentNow
    ? clamp01((Date.now() - startMs) / slotMs)
    : clamp01(1 - (startMs - Date.now()) / (60 * 60 * 1000));

  const detailLine = hint.detailLine ?? '';
  const branchName = hint.branchName ?? '';
  const employeeName = hint.employeeName ?? '';
  const employeeAvatarUrl = hint.employeeAvatarUrl ?? '';
  const priceFormatted =
    typeof hint.price === 'number' && Number.isFinite(hint.price)
      ? new Intl.NumberFormat(locale === 'cs' ? 'cs-CZ' : 'en-GB', {
          style: 'currency',
          currency: 'CZK',
          maximumFractionDigits: hint.price % 1 === 0 ? 0 : 2,
        }).format(hint.price)
      : '';

  await rbLiveActivityUpdateForBooking(hint.bookingId, {
    subtitle,
    title,
    detailLine,
    branchName,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    employeeName,
    employeeAvatarUrl,
    employeeAvatarAuthToken: apiToken,
    priceFormatted,
    progress01,
    accentHex: accentColor,
  });

  await rbLiveActivityCleanup([hint.bookingId]);
  return 'done';
}

export default function LiveActivityReconcileProvider({ children }: { children: React.ReactNode }) {
  const { apiToken } = useAuth();
  const { accentColor } = useAccentColor();
  const { t, locale } = useTranslation();
  const runningRef = useRef(false);
  const lastRunAtRef = useRef(0);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    if (!apiToken) return;

    const run = async (opts?: { allowNetwork?: boolean; force?: boolean }) => {
      const now = Date.now();
      if (runningRef.current) return;
      if (!opts?.force && now - lastRunAtRef.current < 150) return; // basic debounce (needs to run fast on foreground)
      runningRef.current = true;
      lastRunAtRef.current = now;
      try {
        // 0) Immediate reschedule hint path: no need to wait for list refresh.
        const hint = await readRescheduleHint();
        if (hint) {
          const res = await reconcileFromRescheduleHint(
            apiToken,
            hint,
            t as any,
            locale,
            accentColor
          );
          await clearRescheduleHint();
          if (res === 'done') return;
        }

        // 1) Fast path: local cache (best effort) for immediate foreground -> lock scenario.
        const cached = await readCachedBookings();
        if (cached.length > 0) {
          await reconcileFromBookings(apiToken, cached as Booking[], t as any, locale, accentColor);
        }

        if (opts?.allowNetwork !== false) {
          // 2) Network refresh: reconcile again with fresh data.
          const res = await getBookings(apiToken);
          const bookings = res.bookings ?? [];
          await writeCachedBookings(bookings);
          await reconcileFromBookings(apiToken, bookings, t as any, locale, accentColor);
        }
      } catch {
        // ignore
      } finally {
        runningRef.current = false;
      }
    };

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        run({ allowNetwork: true }).catch(() => {});
      }
      if (state === 'inactive') {
        // Pre-lock snapshot happens around here; do only fast work (no network).
        run({ allowNetwork: false, force: true }).catch(() => {});
      }
    });

    // Also run once on mount (cold start into foreground).
    run({ allowNetwork: true }).catch(() => {});

    return () => {
      sub.remove();
    };
  }, [apiToken, accentColor, locale, t]);

  return children as any;
}
