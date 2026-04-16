import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { getBookings, type Booking } from '@/api/bookings';
import { useAccentColor } from '@/app/contexts/AccentColorContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { rbLiveActivityCleanup, rbLiveActivityUpdateForBooking } from '@/lib/rb-live-activity';
import {
  buildReservationLiveActivityFromBooking,
  buildReservationLiveActivityFromHint,
  pickLiveActivityBooking,
  type RBLiveActivityCopy,
} from '@/lib/rb-live-activity-reservation';

const RB_LIVE_ACTIVITY_BOOKINGS_CACHE_KEY = 'rb_live_activity_bookings_cache_v1';
export const RB_RESCHEDULE_HINT_KEY = 'rb_live_activity_reschedule_hint_v1';

type CachedBooking = Pick<
  Booking,
  'id' | 'status' | 'date' | 'slotStart' | 'slotEnd' | 'price' | 'branch' | 'employee'
>;

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

function buildLiveActivityCopy(locale: string, t: (key: any) => string): RBLiveActivityCopy {
  return {
    startsInLabel: t('liveActivityStartsInLabel'),
    activeLabel: t('liveActivityEndsInLabel'),
    rescheduledLabel: locale === 'cs' ? 'Rezervace přesunuta' : 'Booking moved',
    rescheduledHeadline: locale === 'cs' ? 'Změna rezervace' : 'Booking updated',
    rescheduledDetail: locale === 'cs' ? 'Klepněte pro detail' : 'Tap for details',
    cancelledLabel: locale === 'cs' ? 'Rezervace zrušena' : 'Booking cancelled',
    cancelledHeadline: locale === 'cs' ? 'Zrušeno' : 'Cancelled',
    cancelledDetail: locale === 'cs' ? 'Klepněte pro detail rezervace' : 'Tap for booking details',
    reviewLabel: locale === 'cs' ? 'Ohodnoťte rezervaci' : 'Review your booking',
    reviewHeadline: locale === 'cs' ? 'Děkujeme!' : 'Thank you!',
  };
}

function toCachedBooking(booking: Booking): CachedBooking {
  return {
    id: booking.id,
    status: booking.status,
    date: booking.date,
    slotStart: booking.slotStart,
    slotEnd: booking.slotEnd,
    price: booking.price,
    branch: booking.branch,
    employee: booking.employee,
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

async function readRescheduleHint(): Promise<RescheduleHint | null> {
  try {
    const raw = await AsyncStorage.getItem(RB_RESCHEDULE_HINT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RescheduleHint>;
    if (!parsed.bookingId || !parsed.startAt || !parsed.endAt || !parsed.ts) return null;
    if (Date.now() - Number(parsed.ts) > 10 * 60_000) return null;
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
  copy: RBLiveActivityCopy,
  locale: string,
  accentColor: string
): Promise<void> {
  const target = pickLiveActivityBooking(bookings);
  if (!target) {
    await rbLiveActivityCleanup([]);
    return;
  }

  const descriptor = buildReservationLiveActivityFromBooking(target, {
    locale,
    accentHex: accentColor,
    copy,
    employeeAvatarAuthToken: apiToken,
    openReview: true,
  });

  await rbLiveActivityUpdateForBooking(descriptor.bookingId, descriptor.state);
  await rbLiveActivityCleanup([descriptor.bookingId]);
}

async function reconcileFromRescheduleHint(
  apiToken: string,
  hint: RescheduleHint,
  copy: RBLiveActivityCopy,
  locale: string,
  accentColor: string
): Promise<'done' | 'skip'> {
  const startMs = new Date(hint.startAt).getTime();
  if (!Number.isFinite(startMs)) return 'skip';

  const diff = startMs - Date.now();
  if (diff > 60 * 60_000) {
    await rbLiveActivityCleanup([]);
    return 'done';
  }

  const descriptor = buildReservationLiveActivityFromHint(hint, {
    locale,
    accentHex: accentColor,
    copy,
    employeeAvatarAuthToken: apiToken,
  });

  await rbLiveActivityUpdateForBooking(descriptor.bookingId, descriptor.state);
  await rbLiveActivityCleanup([descriptor.bookingId]);
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

    const copy = buildLiveActivityCopy(locale, t as any);

    const run = async (opts?: { allowNetwork?: boolean; force?: boolean }) => {
      const now = Date.now();
      if (runningRef.current) return;
      if (!opts?.force && now - lastRunAtRef.current < 150) return;

      runningRef.current = true;
      lastRunAtRef.current = now;

      try {
        const hint = await readRescheduleHint();
        if (hint) {
          const result = await reconcileFromRescheduleHint(
            apiToken,
            hint,
            copy,
            locale,
            accentColor
          );
          await clearRescheduleHint();
          if (result === 'done') return;
        }

        const cached = await readCachedBookings();
        if (cached.length > 0) {
          await reconcileFromBookings(apiToken, cached as Booking[], copy, locale, accentColor);
        }

        if (opts?.allowNetwork !== false) {
          const res = await getBookings(apiToken);
          const bookings = res.bookings ?? [];
          await writeCachedBookings(bookings);
          await reconcileFromBookings(apiToken, bookings, copy, locale, accentColor);
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
        run({ allowNetwork: false, force: true }).catch(() => {});
      }
    });

    run({ allowNetwork: true }).catch(() => {});

    return () => {
      sub.remove();
    };
  }, [apiToken, accentColor, locale, t]);

  return children as any;
}
