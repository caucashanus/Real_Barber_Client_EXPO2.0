import type { BookingEntity } from '@/lib/booking/constants';

type BranchLike = { id?: string; name?: string | null; slug?: string | null } | null | undefined;

const BRANCH_THEME_HSL: Record<string, string> = {
  barrandov: '30 65% 35%',
  hagibor: '217 70% 35%',
  kacerov: '45 85% 35%',
  modrany: '0 70% 35%',
  modřany: '0 70% 35%',
};

const DEFAULT_THEME_HSL = '30 65% 35%';

function branchHaystack(branch: BranchLike): string {
  return [branch?.id, branch?.slug, branch?.name]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .join(' ')
    .toLowerCase();
}

function resolveBranchKey(branch: BranchLike): string | null {
  const hay = branchHaystack(branch);
  if (!hay) return null;
  for (const key of Object.keys(BRANCH_THEME_HSL)) {
    if (hay.includes(key)) return key;
  }
  if (hay.includes('kačerov')) return 'kacerov';
  if (hay.includes('modřany')) return 'modrany';
  return null;
}

export function getBranchThemeColorHsl(branch: BranchLike): string {
  const key = resolveBranchKey(branch);
  if (key && BRANCH_THEME_HSL[key]) return BRANCH_THEME_HSL[key];
  return DEFAULT_THEME_HSL;
}

export function getBranchThemeColorCss(branch: BranchLike): string {
  const hsl = getBranchThemeColorHsl(branch);
  return `hsl(${hsl.replace(/\s+/g, ', ')})`;
}

export function resolveBranchName(
  branchId: string | undefined,
  branches: BookingEntity[],
  profileBranches: { id: string; name?: string }[] = []
): string | undefined {
  if (!branchId) return undefined;
  const fromProfile = profileBranches.find((b) => b.id === branchId);
  if (fromProfile?.name) return fromProfile.name;
  const fromList = branches.find((b) => b.id === branchId);
  return fromList?.name ?? branchId;
}

const RELATIVE_DAY: Record<'cs' | 'en', { today: string; tomorrow: string; dayAfter: string }> = {
  cs: { today: 'Dnes', tomorrow: 'Zítra', dayAfter: 'Pozítří' },
  en: { today: 'Today', tomorrow: 'Tomorrow', dayAfter: 'Day after tomorrow' },
};

function formatDateShort(dateStr: string, locale: 'cs' | 'en'): string {
  const part = dateStr.slice(0, 10);
  const [, m, d] = part.split('-');
  if (!d || !m) return part;
  try {
    const [y] = part.split('-').map(Number);
    const dt = new Date(y, Number(m) - 1, Number(d));
    return dt.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-GB', {
      day: 'numeric',
      month: 'numeric',
    });
  } catch {
    return `${d}. ${parseInt(m, 10)}.`;
  }
}

export function formatNearestTermLabel(dateStr: string, locale: 'cs' | 'en' = 'cs'): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const part = dateStr.slice(0, 10);
  const [y, m, d] = part.split('-').map(Number);
  if (Number.isNaN(d) || Number.isNaN(m)) return formatDateShort(dateStr, locale);

  const slotDate = new Date(y, m - 1, d);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((slotDate.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));
  const rel = RELATIVE_DAY[locale];

  if (diffDays === 0) return rel.today;
  if (diffDays === 1) return rel.tomorrow;
  if (diffDays === 2) return rel.dayAfter;
  if (diffDays >= 3 && diffDays <= 6) {
    const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
    const wd = slotDate.toLocaleDateString(tag, { weekday: 'long' });
    const dayLabel = wd ? wd.charAt(0).toLocaleUpperCase(tag) + wd.slice(1) : '';
    const dateShort = formatDateShort(part, locale);
    return dateShort ? `${dayLabel} ${dateShort}` : dayLabel;
  }
  return formatDateShort(dateStr, locale);
}

export function branchImageUrl(branch: BookingEntity): string | null {
  const url = branch.imageUrl ?? branch.avatarUrl;
  return typeof url === 'string' && url.trim() ? url.trim() : null;
}
