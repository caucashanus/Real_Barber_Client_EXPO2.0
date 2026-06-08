import type { TranslationKey } from '@/locales';

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
  untilDisplay: string;
}

/**
 * Parsuje platnost kupónu pro pilulky v UI.
 * Bez platného `validUntil` se v UI nezobrazuje nic (ani `validFrom`).
 * S `validUntil` se zobrazí jen konec platnosti („Do …“).
 */
export function resolveClientCouponValidity(
  _validFrom: string,
  validUntil: string | null,
  locale: string
): ClientCouponValidityModel | null {
  const rawUntil = validUntil?.trim() ?? '';
  if (!rawUntil) return null;

  const untilD = new Date(rawUntil);
  if (!Number.isFinite(untilD.getTime())) return null;

  return {
    untilDisplay: formatCouponDate(untilD, locale),
  };
}

/** Krátký text pro přístupnost (jedna řádka) — jen „Do …“, pokud existuje validUntil. */
export function getClientCouponValidityA11y(
  validFrom: string,
  validUntil: string | null,
  locale: string,
  t: (key: TranslationKey) => string
): string | null {
  const m = resolveClientCouponValidity(validFrom, validUntil, locale);
  if (!m) return null;
  return `${t('homeCouponValidityPillUntil')} ${m.untilDisplay}`;
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
