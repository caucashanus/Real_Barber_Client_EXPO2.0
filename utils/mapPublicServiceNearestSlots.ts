import type { PublicServiceNearestSlot } from '@/api/publicServicePage';
import type { Locale } from '@/contexts/LanguageContext';
import type { NearestBranchHomeSlot } from '@/utils/nearestBranchHomeSlots';

function pickLocalizedName(
  entity: { name: string; nameEn?: string | null; nameUk?: string | null },
  locale: Locale
): string {
  if (locale === 'en' && entity.nameEn?.trim()) return entity.nameEn.trim();
  if (locale === 'uk' && entity.nameUk?.trim()) return entity.nameUk.trim();
  return entity.name.trim();
}

function normalizeHmm(time: string): string {
  const t = time.trim();
  if (!t) return '';
  const parts = t.split(':');
  if (parts.length >= 2) {
    const h = parts[0]?.padStart(2, '0') ?? '00';
    const m = parts[1]?.padStart(2, '0') ?? '00';
    return `${h}:${m}`;
  }
  return t;
}

export function mapPublicServiceNearestSlots(
  slots: PublicServiceNearestSlot[] | null | undefined,
  locale: Locale
): NearestBranchHomeSlot[] {
  if (!slots?.length) return [];

  const out: NearestBranchHomeSlot[] = [];
  for (const raw of slots) {
    const date = raw.date?.trim().slice(0, 10);
    const time = normalizeHmm(raw.time?.trim() ?? '');
    const endTime = normalizeHmm(raw.endTime?.trim() || time);
    const branchId = raw.branch?.id?.trim();
    const employeeId = raw.employee?.id?.trim();
    if (!date || !time || !branchId || !employeeId) continue;

    out.push({
      employeeId,
      employeeName: pickLocalizedName(raw.employee, locale),
      date,
      time,
      endTime,
      duration: raw.duration,
      branchId,
      branchName: pickLocalizedName(raw.branch, locale),
      branchAddress: null,
    });
  }

  out.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return a.time.localeCompare(b.time);
  });

  return out;
}
