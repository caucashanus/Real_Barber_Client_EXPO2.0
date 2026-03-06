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

export interface ClientReferralsResponse {
  client: { id: string; name: string; email: string };
  stats: ClientReferralsStats;
  referralsMade: unknown[];
  referralsReceived: unknown[];
  requests: unknown[];
  activePrograms: unknown[];
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
