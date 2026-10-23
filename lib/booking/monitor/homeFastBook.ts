import {
  primeBookingMonitorHomeFastBookSession,
  type PrimeBookingMonitorHomeFastBookParams,
} from '@/lib/booking/monitor/client';

export type {
  HomeFastBookMonitorMode,
  HomeFastBookMonitorPath,
} from '@/lib/booking/monitor/types';

/** Před navigací z homepage „Hledáš nejbližší termín?“ (parita web `primeHomeFastBookBookingMonitor`). */
export function primeHomeFastBookBookingMonitor(
  params: PrimeBookingMonitorHomeFastBookParams
): void {
  primeBookingMonitorHomeFastBookSession(params);
}
