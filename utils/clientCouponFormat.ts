/** Jedno datum platnosti kupónu (lokále Real Barber / EN). */
function formatCouponDate(d: Date, locale: string): string {
  const dl = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  return d.toLocaleDateString(dl, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export interface ClientCouponValidityModel {
  fromDisplay: string;
  untilDisplay: string | null;
  /** true = žádné platné `validUntil` (v sheetu jen pilulka „Od“) */
  isOpenEnded: boolean;
  /** Platnost začíná až po dnešním kalendářním dni (lokální čas zařízení). */
  startsInFuture: boolean;
}

/**
 * Parsuje platnost kupónu pro pilulky v UI („Od …“, případně „Do …“).
 */
export function resolveClientCouponValidity(
  validFrom: string,
  validUntil: string | null,
  locale: string
): ClientCouponValidityModel | null {
  const fromD = new Date(validFrom);
  if (!Number.isFinite(fromD.getTime())) return null;

  const startOf = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  };
  const startsInFuture = startOf(fromD) > startOf(new Date());

  const rawUntil = validUntil?.trim() ?? '';
  const untilD = rawUntil !== '' ? new Date(rawUntil) : null;
  const untilOk = untilD != null && Number.isFinite(untilD.getTime());

  return {
    fromDisplay: formatCouponDate(fromD, locale),
    untilDisplay: untilOk && untilD ? formatCouponDate(untilD, locale) : null,
    isOpenEnded: !untilOk,
    startsInFuture,
  };
}

/**
 * Krátký text pro přístupnost (jedna řádka).
 * `homeCardUntilOnly`: na domovských kartách jen „Do …“, jinak null (bez platného konce).
 */
export function getClientCouponValidityA11y(
  validFrom: string,
  validUntil: string | null,
  locale: string,
  t: (key: string) => string,
  options?: { homeCardUntilOnly?: boolean }
): string | null {
  const m = resolveClientCouponValidity(validFrom, validUntil, locale);
  if (!m) return null;
  if (options?.homeCardUntilOnly) {
    if (m.isOpenEnded || !m.untilDisplay) return null;
    return `${t('homeCouponValidityPillUntil')} ${m.untilDisplay}`;
  }
  const parts: string[] = [`${t('homeCouponValidityPillFrom')} ${m.fromDisplay}`];
  if (!m.isOpenEnded && m.untilDisplay) {
    parts.push(`${t('homeCouponValidityPillUntil')} ${m.untilDisplay}`);
  }
  return parts.join(', ');
}

/** Fráze omezení z API / CRM — shodné s naším statickým štítkem `homeCouponLimitedScope`. */
const LIMITED_SCOPE_REPEAT_PHRASES = [
  'Pouze u vybraných poboček, služeb nebo holičů',
  'Limited to selected branches, services or staff',
] as const;

function normalizeScopeText(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Když `!applicableToAll`, zda ještě ukázat řádek/sekci s `homeCouponLimitedScope`.
 * Pokud API už vrátí stejnou informaci v popisu, nezobrazujeme ji znovu (platnost Od/Do beze změny).
 */
export function shouldShowClientCouponLimitedScopeHint(
  applicableToAll: boolean,
  description: string | null | undefined,
  translatedLimitedScopeLabel: string
): boolean {
  if (applicableToAll) return false;
  const raw = description?.trim() ?? '';
  if (!raw) return true;

  const d = normalizeScopeText(raw);
  if (d === normalizeScopeText(translatedLimitedScopeLabel)) return false;
  for (const p of LIMITED_SCOPE_REPEAT_PHRASES) {
    if (d === normalizeScopeText(p)) return false;
  }
  return true;
}
