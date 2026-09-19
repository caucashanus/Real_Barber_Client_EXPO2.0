import { fetchCrm } from './http';

export type ReferralInviteStatus =
  | 'PHONE_SUBMITTED'
  | 'INELIGIBLE_EXISTING'
  | 'REGISTERED'
  | 'BOOKING_CREATED'
  | 'QUALIFIED'
  | 'REWARDED'
  | 'EXPIRED';

export interface ReferralRewards {
  referrerRbc: number;
  refereeRbc: number;
}

export interface ReferralCover {
  imageUrl: string | null;
  linkUrl: string | null;
}

export interface ClientReferralsConfig {
  coverImageUrl: string | null;
  coverLinkUrl: string | null;
  shareBaseUrl: string;
  referrerRewardRbc: number;
  attributionTtlDays: number;
}

export interface ClientReferralsShareLink {
  code: string;
  url: string;
}

export interface ClientReferralsStats {
  totalInvites: number;
  qualified: number;
  rewarded: number;
  pendingRbc: number;
  totalRbcEarned: number;
}

export interface ClientReferralInvite {
  id: string;
  status: ReferralInviteStatus;
  statusLabel: string;
  phone: string;
  createdAt: string;
  expiresAt: string | null;
  qualifiedAt: string | null;
  rewardedAt: string | null;
  referrerRewardRbc: number | null;
}

type ClientReferralInviteRaw = Omit<ClientReferralInvite, 'phone'> & {
  phone?: string;
  phoneMasked?: string;
};

function normalizeReferralInvite(invite: ClientReferralInviteRaw): ClientReferralInvite {
  const phone = invite.phone?.trim() || invite.phoneMasked?.trim() || '';
  const { phoneMasked: _phoneMasked, ...rest } = invite;
  return { ...rest, phone };
}

export interface ClientReferralsResponse {
  client: {
    id: string;
    name: string;
    rbCoins: number;
  };
  enabled: boolean;
  config: ClientReferralsConfig;
  shareLink: ClientReferralsShareLink | null;
  stats: ClientReferralsStats;
  invites: ClientReferralInvite[];
}

export interface ReferralShareLinkResponse {
  code: string;
  shareUrl: string;
  rewards: ReferralRewards;
  cover: ReferralCover;
}

/** Striktní kontrola — jen `enabled === true`, ne truthy. */
export function isReferralProgramEnabled(
  dashboard: ClientReferralsResponse | null | undefined
): boolean {
  return dashboard?.enabled === true;
}

/** GET /api/client/referrals — referrer dashboard (stats + invites). */
export async function getClientReferrals(apiToken: string): Promise<ClientReferralsResponse> {
  const data = await fetchCrm<Omit<ClientReferralsResponse, 'invites'> & { invites: ClientReferralInviteRaw[] }>(
    '/api/client/referrals',
    { apiToken }
  );

  return {
    ...data,
    invites: data.invites.map(normalizeReferralInvite),
  };
}

/** POST /api/client/referrals/share-link — idempotent share code + URL. */
export async function postReferralShareLink(
  apiToken: string
): Promise<ReferralShareLinkResponse> {
  return fetchCrm<ReferralShareLinkResponse>('/api/client/referrals/share-link', {
    method: 'POST',
    apiToken,
  });
}
