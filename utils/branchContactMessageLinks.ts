import type { TranslationKey } from '@/locales';
import {
  buildBranchProfileSmsLink,
  buildBranchProfileTelegramLink,
  buildBranchProfileWhatsAppLink,
} from '@/utils/branchProfileContactLinks';
import { interpolateTemplate } from '@/utils/profileShareLinks';

export function buildBranchContactMessageLinks(
  branchName: string,
  t: (key: TranslationKey) => string
) {
  const message = interpolateTemplate(t('branchAvailabilityMessage'), { name: branchName });

  return {
    sms: buildBranchProfileSmsLink(message),
    whatsApp: buildBranchProfileWhatsAppLink(message),
    telegram: buildBranchProfileTelegramLink(message),
  };
}
