import { CrmHttpError, fetchCrm } from './http';

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

export interface BranchReview {
  id: string;
  rating: number;
  [key: string]: unknown;
}

export interface Branch {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  media?: { url: string; order?: number; type?: string }[];
  address?: string;
  webUrl?: string | null;
  services?: BranchService[];
  employees?: BranchEmployee[] | Record<string, BranchEmployee>;
  reviews?: BranchReview[];
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
  if (options.includeReviews !== undefined)
    params.set('includeReviews', String(options.includeReviews));
  if (options.reviewsLimit !== undefined) params.set('reviewsLimit', String(options.reviewsLimit));
  const qs = params.toString();

  return fetchCrm<Branch[]>(`/api/client/branches${qs ? `?${qs}` : ''}`, { apiToken: token });
}

/** GET /api/client/branches/:id — detail pobočky včetně služeb (EmployeeItemPrice / vazby na holiče). */
export async function getBranchById(token: string, branchId: string): Promise<Branch> {
  try {
    const json = await fetchCrm<unknown>(`/api/client/branches/${encodeURIComponent(branchId)}`, {
      apiToken: token,
    });
    if (json && typeof json === 'object') {
      const o = json as Record<string, unknown>;
      if (o.branch && typeof o.branch === 'object') return o.branch as Branch;
      if (o.data && typeof o.data === 'object') return o.data as Branch;
    }
    return json as Branch;
  } catch (e) {
    if (e instanceof CrmHttpError && e.status === 404) throw new Error('Branch not found');
    throw e;
  }
}
