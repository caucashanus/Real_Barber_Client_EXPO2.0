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

export default function LiveActivityReconcileProvider({ children }: { children: React.ReactNode }) {
  const { apiToken } = useAuth();
  const { accentColor } = useAccentColor();
  const { t, locale } = useTranslation();
  const runningRef = useRef(false);
  const lastRunAtRef = useRef(0);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    if (!apiToken) return;

    const run = async () => {
      const now = Date.now();
      if (runningRef.current) return;
      if (now - lastRunAtRef.current < 1500) return; // basic debounce
      runningRef.current = true;
      lastRunAtRef.current = now;
      try {
        const res = await getBookings(apiToken);
        const bookings = res.bookings ?? [];

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

        const subtitle = isCurrentNow
          ? t('liveActivityEndsInLabel')
          : t('liveActivityStartsInLabel');
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
      } catch {
        // ignore
      } finally {
        runningRef.current = false;
      }
    };

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        run().catch(() => {});
      }
    });

    // Also run once on mount (cold start into foreground).
    run().catch(() => {});

    return () => {
      sub.remove();
    };
  }, [apiToken, accentColor, locale, t]);

  return children as any;
}
