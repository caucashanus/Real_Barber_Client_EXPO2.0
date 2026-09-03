import type { SFSymbol } from 'sf-symbols-typescript';

/** Live Activity se spustí T−90 min před termínem. */
export const BOOKING_LA_START_MS = 90 * 60 * 1000;

/** @deprecated Alias pro BOOKING_LA_START_MS — CRM / starší kód. */
export const BOOKING_SOON_MS = BOOKING_LA_START_MS;

/** Krátké okno „Právě začínáme“ před přechodem do „Probíhá“. */
export const BOOKING_STAGE_START_GRACE_MS = 2 * 60 * 1000;

/** Stage 7 (hodnocení) — max doba zobrazení Live Activity po konci slotu. */
export const BOOKING_REVIEW_LINGER_MS = 2 * 60 * 60 * 1000;

export const BOOKING_STAGE_COUNT = 8;
export const BOOKING_REVIEW_STAGE = 7;

/** Minuty před termínem, kdy začíná daný stage (0–5). */
export const BOOKING_STAGE_OFFSETS_MIN = [90, 60, 20, 10, 5, 0] as const;

export type BookingActivityStageKind = 'normal' | 'cancelled' | 'rescheduled';

export type BookingActivityCtaKind = 'none' | 'countdown' | 'navigate' | 'inspire' | 'drinks' | 'duration';

export type BookingActivityStageConfig = {
  title: string;
  /** Placeholder `{employeeName}` / `{serviceName}` se nahradí v buildu. */
  titleTemplate?: string;
  ctaKind: BookingActivityCtaKind;
  ctaLabel?: string;
  ctaIcon?: SFSymbol;
  showEmployeeAvatar?: boolean;
  progressPhase: 0 | 1 | 2;
};

export const BOOKING_STAGE_CONFIG: readonly BookingActivityStageConfig[] = [
  {
    title: 'Počítáme s vámi',
    ctaKind: 'countdown',
    progressPhase: 0,
  },
  {
    title: 'Brzy začínáme',
    ctaKind: 'navigate',
    ctaLabel: 'Navigovat',
    ctaIcon: 'location.north.fill',
    progressPhase: 0,
  },
  {
    title: 'Kdo se o vás dnes postará?',
    ctaKind: 'countdown',
    progressPhase: 0,
  },
  {
    title: 'Podívejte se na katalog účesů',
    ctaKind: 'inspire',
    ctaLabel: 'Inspirace',
    ctaIcon: 'sparkles',
    progressPhase: 0,
  },
  {
    title: 'Je libo káva nebo limonáda?',
    ctaKind: 'drinks',
    ctaLabel: 'Nápoje',
    ctaIcon: 'cup.and.saucer.fill',
    progressPhase: 0,
  },
  {
    title: 'Právě začínáme',
    ctaKind: 'none',
    progressPhase: 1,
  },
  {
    title: 'Probíhá',
    ctaKind: 'duration',
    progressPhase: 1,
  },
  {
    title: 'Ohodnoťte',
    ctaKind: 'none',
    progressPhase: 2,
  },
] as const;

export const BOOKING_EXCEPTION_STAGE_CONFIG: Record<
  Exclude<BookingActivityStageKind, 'normal'>,
  { title: string; subtitle: string }
> = {
  cancelled: {
    title: 'Rezervace zrušena',
    subtitle: 'Termín byl zrušen',
  },
  rescheduled: {
    title: 'Termín změněn',
    subtitle: 'Otevřete detail rezervace',
  },
};

/** 3 vizuální fáze progress baru (Expo delivery styl). */
export const BOOKING_PROGRESS_PHASE_ICONS = [
  'calendar.badge.clock',
  'scissors',
  'star.fill',
] as const satisfies readonly SFSymbol[];

export function getBookingStageOffsetMs(index: number): number {
  const minutes = BOOKING_STAGE_OFFSETS_MIN[index] ?? 0;
  return minutes * 60 * 1000;
}

export function getBookingStageConfig(stage: number): BookingActivityStageConfig {
  const clamped = Math.max(0, Math.min(BOOKING_REVIEW_STAGE, stage));
  return BOOKING_STAGE_CONFIG[clamped] ?? BOOKING_STAGE_CONFIG[0];
}

export function formatBookingStageTitle(
  config: BookingActivityStageConfig,
  employeeName?: string,
  serviceName?: string
): string {
  const template = config.titleTemplate ?? config.title;
  return template
    .replace('{employeeName}', employeeName?.trim() || 'barbera')
    .replace('{serviceName}', serviceName?.trim() || 'střih');
}
