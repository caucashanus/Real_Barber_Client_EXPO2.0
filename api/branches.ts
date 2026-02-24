const CRM_BASE = 'https://crm.xrb.cz';

export interface BranchService {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  duration: number;
  employee: { id: string; name: string };
  category: { id: string; name: string };
}

export interface BranchEmployee {
  id: string;
  name: string;
  avatarUrl?: string | null;
  isActive?: boolean;
  [key: string]: unknown;
}

export interface Branch {
  id: string;
  name: string;
  imageUrl?: string | null;
  media?: Array<{ url: string; order?: number }>;
  address?: string;
  webUrl?: string | null;
  services?: BranchService[];
  employees?: BranchEmployee[] | Record<string, BranchEmployee>;
  [key: string]: unknown;
}

export interface GetBranchesOptions {
  includeReviews?: boolean;
  reviewsLimit?: number;
}

export async function getBranches(
  token: string,
  options: GetBranchesOptions = {}
): Promise<Branch[]> {
  const params = new URLSearchParams();
  if (options.includeReviews !== undefined) params.set('includeReviews', String(options.includeReviews));
  if (options.reviewsLimit !== undefined) params.set('reviewsLimit', String(options.reviewsLimit));
  const qs = params.toString();
  const url = `${CRM_BASE}/api/client/branches${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<Branch[]>;
}
