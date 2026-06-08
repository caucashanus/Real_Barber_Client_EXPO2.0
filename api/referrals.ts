import { fetchCrm } from './http';

export interface ClientReferralsStats {
  totalReferralsMade: number;
  qualifiedReferrals: number;
  rewardedReferrals: number;
  totalRewardsEarned: number;
  pendingRewards: number;
  totalReferralsReceived: number;
  pendingRequests: number;
}

/** Aktivní doporučovací program z GET /api/client/referrals. */
export interface ReferralActiveProgram {
  id: string;
  name: string;
  description: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  /** Banner / poster programu (pozadí karty v peněžence). */
  coverImageUrl?: string | null;
  rewardedCount?: number | null;
  maxRewards?: number | null;
  rewardProgressText?: string | null;
  referrerRewardType: string;
  referrerRewardAmount: number;
  refereeRewardType: string;
  refereeRewardAmount: number | null;
  minPurchaseAmount: number;
}

export interface ClientReferralsResponse {
  client: { id: string; name: string; email: string };
  stats: ClientReferralsStats;
  referralsMade: ClientReferralItem[];
  referralsReceived: ClientReferralItem[];
  pendingAttributions?: PendingAttributionItem[];
  requests: unknown[];
  activePrograms: ReferralActiveProgram[];
  progressEnabled: boolean;
}

export interface PendingAttributionItem {
  id: string;
  status: string; // PENDING
  phone: string;
  createdAt: string;
  referralLink: { code: string; coverImageUrl?: string | null };
  program: {
    id: string;
    name: string;
    coverImageUrl?: string | null;
    referrerRewardType?: string;
    referrerRewardAmount?: number;
  };
}

export interface ReferralPerson {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface ReferralProgress {
  completedSteps?: number;
  totalSteps?: number;
  percentage?: number;
  nextStep?: string | null;
  nextStepName?: string | null;
  daysRemaining?: number | null;
  canProgress?: boolean;
  isComplete?: boolean;
  error?: string | null;
}

export interface ClientReferralItem {
  id: string;
  programId: string;
  referrerId: string;
  refereeId: string | null;
  status: string;
  referralCode: string | null;
  referralLinkId: string | null;
  coverImageUrl: string | null;
  qualifiedAt?: string | null;
  rewardedAt?: string | null;
  triggerAmount?: number | null;
  referrerReward?: number | null;
  refereeReward?: number | null;
  referralLink?: { code?: string | null; coverImageUrl?: string | null } | null;
  attribution?: { status: string; createdAt: string; consumedAt?: string | null } | null;
  spendProgress?: {
    spentCashCard: number;
    requiredAmount: number;
    remaining: number;
    startAt?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  program?: {
    id: string;
    name: string;
    coverImageUrl?: string | null;
    referrerRewardType?: string;
    referrerRewardAmount?: number;
  } | null;
  referee?: ReferralPerson | null;
  progress?: ReferralProgress | null;
}

/** GET /api/client/referrals – client's referral data (made, received, stats, programs). */
export async function getReferrals(
  apiToken: string,
  options?: { includeProgress?: boolean }
): Promise<ClientReferralsResponse> {
  const search = new URLSearchParams();
  if (options?.includeProgress) search.set('includeProgress', 'true');
  const qs = search.toString();

  return fetchCrm<ClientReferralsResponse>(`/api/client/referrals${qs ? `?${qs}` : ''}`, {
    apiToken,
  });
}

export interface GenerateReferralBody {
  programId: string;
  coverImageUrl?: string | null;
}

export interface ReferralGenerated {
  id: string;
  code: string;
  status?: string;
  coverImageUrl?: string | null;
  createdAt?: string;
}

export interface GenerateReferralResponse {
  message?: string;
  referral: ReferralGenerated;
}

/** POST /api/client/referrals/generate – generate referral code for given program. */
export async function generateReferral(
  apiToken: string,
  body: GenerateReferralBody
): Promise<GenerateReferralResponse> {
  const token = apiToken.trim().replace(/^Bearer\s+/i, '');
  return fetchCrm<GenerateReferralResponse>('/api/client/referrals/generate', {
    method: 'POST',
    apiToken: token,
    body,
  });
}
