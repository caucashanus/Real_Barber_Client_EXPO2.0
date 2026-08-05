import type { TranslationKey } from '@/locales';
import {
  buildBranchProfileSmsLink,
  buildBranchProfileTelegramLink,
  buildBranchProfileWhatsAppLink,
} from '@/utils/branchProfileContactLinks';
import { interpolateTemplate } from '@/utils/profileShareLinks';

export function buildProfileContactMessageLinks(
  contactName: string,
  t: (key: TranslationKey) => string,
  messageKey: TranslationKey = 'branchAvailabilityMessage'
) {
  const message = interpolateTemplate(t(messageKey), { name: contactName });

  return {
    sms: buildBranchProfileSmsLink(message),
    whatsApp: buildBranchProfileWhatsAppLink(message),
    telegram: buildBranchProfileTelegramLink(message),
  };
}

export function buildBranchContactMessageLinks(
  branchName: string,
  t: (key: TranslationKey) => string
) {
  return buildProfileContactMessageLinks(branchName, t, 'branchAvailabilityMessage');
}
