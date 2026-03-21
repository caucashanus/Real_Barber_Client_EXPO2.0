export function formatToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Měsíce ve 2. pádu (genitiv) pro datum typu „7. ledna 2000“. */
const CS_MONTHS_LONG = [
  'ledna',
  'února',
  'března',
  'dubna',
  'května',
  'června',
  'července',
  'srpna',
  'září',
  'října',
  'listopadu',
  'prosince',
] as const;

/**
 * Čitelné datum pro UI (cs: 7. ledna 2000, en: 7 January 2000).
 */
export function formatDateLocaleLong(date: Date, locale: 'cs' | 'en'): string {
  if (locale === 'cs') {
    const d = date.getDate();
    const m = date.getMonth();
    const y = date.getFullYear();
    return `${d}. ${CS_MONTHS_LONG[m]} ${y}`;
  }
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return formatToYYYYMMDD(date);
  }
}