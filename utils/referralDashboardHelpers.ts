import type { ClientReferralInvite, ReferralInviteStatus } from '@/api/referrals';

export type ReferralDashboardStep = 'home' | 'rules' | 'invites';

export const REFERRAL_MARKETING_CZK = 500;
export const DEFAULT_REFERRER_REWARD_RBC = 500;
export const DEFAULT_ATTRIBUTION_TTL_DAYS = 30;

export const REFERRAL_INVITE_HERO = require('@/assets/img/referral/invite-hero.webp');
export const REFERRAL_REWARD_GIFT = require('@/assets/img/referral/reward-gift.webp');

export function getClientReferralSlug(clientId: string): string {
  return clientId;
}

export function referralDashboardHref(slug: string): `/u/${string}/doporuceni` {
  return `/u/${slug}/doporuceni`;
}

export function formatReferralRbc(value: number): string {
  return value.toLocaleString('cs-CZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function getInviteReachedIndex(status: ReferralInviteStatus): number | null {
  switch (status) {
    case 'PHONE_SUBMITTED':
    case 'REGISTERED':
      return 0;
    case 'BOOKING_CREATED':
      return 1;
    case 'QUALIFIED':
      return 2;
    case 'REWARDED':
      return 3;
    case 'EXPIRED':
      return 0;
    case 'INELIGIBLE_EXISTING':
      return null;
    default:
      return 0;
  }
}

export function inviteShowsCountdown(status: ReferralInviteStatus): boolean {
  return (
    status === 'PHONE_SUBMITTED' ||
    status === 'REGISTERED' ||
    status === 'BOOKING_CREATED'
  );
}

export function getInviteDaysRemaining(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function getInviteProgressLabels(t: (key: import('@/locales').TranslationKey) => string) {
  return [
    t('referralProgressAccepted'),
    t('referralProgressBooking'),
    t('referralProgressVisit'),
    t('referralProgressReward'),
  ] as const;
}

export function getInviteStatusCaption(
  invite: ClientReferralInvite,
  t: (key: import('@/locales').TranslationKey) => string
): string {
  if (invite.status === 'INELIGIBLE_EXISTING') {
    return t('referralInviteIneligibleCaption');
  }
  if (invite.status === 'EXPIRED') {
    return t('referralInviteExpiredCaption');
  }
  return invite.statusLabel;
}

export const REFERRAL_PROGRESS_STEP_COUNT = 4;
