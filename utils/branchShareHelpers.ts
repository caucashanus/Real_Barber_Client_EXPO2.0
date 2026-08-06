import type { Branch } from '@/api/branches';
import type { Locale } from '@/contexts/LanguageContext';
import { getBranchGoogleReviewUrl } from '@/constants/branchGoogleReviews';
import { BRANCH_DETAIL_ROUTE } from '@/constants/profileDetailRoutes';
import { resolveInternalBranchIdFromCrmUuid } from '@/constants/crmBranchIds';
import { getTranslation } from '@/locales';
import type { TranslationKey } from '@/locales';
import { interpolateTemplate } from '@/utils/profileShareLinks';

function normalizePublicUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function getBranchProfileShareUrl(branch: Branch, locale: Locale): string {
  const webUrl = typeof branch.webUrl === 'string' ? branch.webUrl.trim() : '';
  if (webUrl) return normalizePublicUrl(webUrl);
  const slug = resolveInternalBranchIdFromCrmUuid(branch.id);
  if (slug) {
    const prefix = locale === 'cs' ? '' : `/${locale}`;
    return `https://realbarber.cz${prefix}/pobocky/${slug}`;
  }
  return `realbarber://${BRANCH_DETAIL_ROUTE.slice(1)}?id=${encodeURIComponent(branch.id)}`;
}

export function getBranchGoogleReviewUrlForCrmId(crmBranchId: string): string | null {
  const internal = resolveInternalBranchIdFromCrmUuid(crmBranchId);
  if (!internal) return null;
  return getBranchGoogleReviewUrl(internal);
}

export function buildBranchShareCopy(
  branchName: string,
  shareUrl: string,
  locale: Locale
): { title: string; emailSubject: string; emailBody: string } {
  const t = (key: TranslationKey) => getTranslation(locale, key);
  return {
    title: `${t('branchShareSheetTitle')} ${branchName}`,
    emailSubject: interpolateTemplate(t('branchShareEmailSubject'), { name: branchName }),
    emailBody: interpolateTemplate(t('branchShareEmailBody'), {
      name: branchName,
      url: shareUrl,
    }),
  };
}

export function buildEmployeeShareCopy(
  displayName: string,
  shareUrl: string,
  locale: Locale
): { title: string; emailSubject: string; emailBody: string } {
  const t = (key: TranslationKey) => getTranslation(locale, key);
  return {
    title: `${t('barberShareSheetTitle')} ${displayName}`,
    emailSubject: interpolateTemplate(t('barberShareEmailSubject'), { name: displayName }),
    emailBody: interpolateTemplate(t('barberShareEmailBody'), {
      name: displayName,
      url: shareUrl,
    }),
  };
}

export function buildBranchBookingHref(branchId: string): string {
  return `/screens/reservation-create?recipe=branch-first&branchId=${encodeURIComponent(branchId)}`;
}
