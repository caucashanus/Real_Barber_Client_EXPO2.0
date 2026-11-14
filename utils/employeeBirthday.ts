import type { TranslationKey } from '@/locales';

export interface EmployeeBirthdayFields {
  hasBirthday?: boolean;
  birthdayAge?: number | null;
}

export interface EmployeeBirthdayBadgeModel {
  popoverText: string;
  age: number;
}

function interpolate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template
  );
}

export function parseBirthdayAge(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const age = Math.floor(value);
  if (age <= 0) return null;
  return age;
}

export function shouldShowEmployeeBirthdayOnCard(params: {
  hasBirthday?: boolean;
  birthdayAge?: number | null;
  contextDayIso: string;
  referenceDayIso: string;
}): boolean {
  if (!params.hasBirthday) return false;
  if (parseBirthdayAge(params.birthdayAge) == null) return false;
  if (!params.contextDayIso || !params.referenceDayIso) return false;
  return params.contextDayIso === params.referenceDayIso;
}

export function shouldShowEmployeeBirthdayOnProfile(fields: EmployeeBirthdayFields): boolean {
  if (!fields.hasBirthday) return false;
  return parseBirthdayAge(fields.birthdayAge) != null;
}

export function formatEmployeeBirthdayPopoverText(
  name: string,
  age: number | null,
  t: (key: TranslationKey) => string
): string {
  const trimmedName = name.trim() || '—';
  if (age != null) {
    return interpolate(t('birthdayPopoverWithAge'), { name: trimmedName, age: String(age) });
  }
  return interpolate(t('birthdayPopoverWithoutAge'), { name: trimmedName });
}

export function resolveEmployeeBirthdayBadgeForCard(
  fields: EmployeeBirthdayFields,
  name: string,
  contextDayIso: string,
  referenceDayIso: string,
  t: (key: TranslationKey) => string
): EmployeeBirthdayBadgeModel | null {
  if (
    !shouldShowEmployeeBirthdayOnCard({
      hasBirthday: fields.hasBirthday,
      birthdayAge: fields.birthdayAge,
      contextDayIso,
      referenceDayIso,
    })
  ) {
    return null;
  }
  const age = parseBirthdayAge(fields.birthdayAge)!;
  return {
    age,
    popoverText: formatEmployeeBirthdayPopoverText(name, age, t),
  };
}

export function resolveEmployeeBirthdayBadgeForProfile(
  fields: EmployeeBirthdayFields,
  name: string,
  t: (key: TranslationKey) => string
): EmployeeBirthdayBadgeModel | null {
  if (!shouldShowEmployeeBirthdayOnProfile(fields)) return null;
  const age = parseBirthdayAge(fields.birthdayAge)!;
  return {
    age,
    popoverText: formatEmployeeBirthdayPopoverText(name, age, t),
  };
}