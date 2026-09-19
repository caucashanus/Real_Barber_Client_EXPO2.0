import { SHARE_OPEN_DELAY_MS, interpolateTemplate } from '@/utils/profileShareLinks';

export { SHARE_OPEN_DELAY_MS };

export interface ReferralShareLinks {
  facebook: string;
  telegram: string;
  whatsapp: string;
  sms: string;
  email: string;
}

export function buildReferralShareMessage(t: (key: import('@/locales').TranslationKey) => string): string {
  return t('referralShareMessageBody');
}

export function buildReferralShareLinks(
  shareUrl: string,
  t: (key: import('@/locales').TranslationKey) => string
): ReferralShareLinks {
  const shareText = buildReferralShareMessage(t);
  const smsBody = `${shareText}\n${shareUrl}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedSms = encodeURIComponent(smsBody);
  const emailSubject = t('referralShareEmailSubject');
  const emailBody = `${shareText}\n\n${shareUrl}`;

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(shareText)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(smsBody)}`,
    sms: `sms:?body=${encodedSms}`,
    email: `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`,
  };
}

export function interpolateReferralTemplate(
  template: string,
  vars: Record<string, string | number>
): string {
  return interpolateTemplate(
    template,
    Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, String(v)]))
  );
}
