const CRM_BASE = 'https://crm.xrb.cz';

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
  /** Banner / poster programu (pozadí karty v peněžence). */
  coverImageUrl?: string | null;
  referrerRewardType: string;
  referrerRewardAmount: number;
  refereeRewardType: string;
  refereeRewardAmount: number | null;
  minPurchaseAmount: number;
}

export interface ClientReferralsResponse {
  client: { id: string; name: string; email: string };
  stats: ClientReferralsStats;
  referralsMade: unknown[];
  referralsReceived: unknown[];
  requests: unknown[];
  activePrograms: ReferralActiveProgram[];
  progressEnabled: boolean;
}

/** GET /api/client/referrals – client's referral data (made, received, stats, programs). */
export async function getReferrals(apiToken: string): Promise<ClientReferralsResponse> {
  const res = await fetch(`${CRM_BASE}/api/client/referrals`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<ClientReferralsResponse>;
}

export interface GenerateReferralBody {
  programId: string;
  coverImageUrl?: string | null;
}

export interface ReferralGenerated {
  id: string;
  programId: string;
  code: string;
  coverImageUrl?: string | null;
  createdAt?: string;
}

/** POST /api/client/referrals/generate – generate referral code for given program. */
export async function generateReferral(
  apiToken: string,
  body: GenerateReferralBody
): Promise<ReferralGenerated> {
  const res = await fetch(`${CRM_BASE}/api/client/referrals/generate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json() as Promise<ReferralGenerated>;
}
