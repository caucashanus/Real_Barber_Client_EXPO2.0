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
  validFrom?: string | null;
  validUntil?: string | null;
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
  referralsMade: ClientReferralItem[];
  referralsReceived: ClientReferralItem[];
  requests: unknown[];
  activePrograms: ReferralActiveProgram[];
  progressEnabled: boolean;
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
  createdAt: string;
  updatedAt: string;
  program?: { id: string; name: string; coverImageUrl?: string | null; referrerRewardType?: string; referrerRewardAmount?: number } | null;
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
  const url = `${CRM_BASE}/api/client/referrals${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, {
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
  const authHeader = apiToken.trim().toLowerCase().startsWith('bearer ')
    ? apiToken.trim()
    : `Bearer ${apiToken.trim()}`;
  const res = await fetch(`${CRM_BASE}/api/client/referrals/generate`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) {
    const raw = await res.text().catch(() => '');
    let message = `Error ${res.status}`;
    try {
      const data = JSON.parse(raw) as { message?: string; error?: string };
      message = data.message || data.error || message;
    } catch {
      if (raw) message = raw.slice(0, 200);
    }
    throw new Error(message);
  }
  return res.json() as Promise<GenerateReferralResponse>;
}
