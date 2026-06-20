import { CLIENT_APP_V1_ENABLED } from '@/constants/clientAppApi';

import { CrmHttpError, fetchClientAppV1, fetchCrm } from './http';

export interface BranchService {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  duration: number;
  employee: { id: string; name: string };
  category: { id: string; name: string };
  employeeIds?: string[];
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
  latitude?: number;
  longitude?: number;
  services?: BranchService[];
  employees?: BranchEmployee[] | Record<string, BranchEmployee>;
  reviews?: BranchReview[];
  averageRating?: number;
  reviewCount?: number;
  priceFrom?: number;
  [key: string]: unknown;
}

export interface GetBranchesOptions {
  includeReviews?: boolean;
  reviewsLimit?: number;
}

function expandV1BranchServices(branch: Branch): Branch {
  const raw = branch.services;
  if (!Array.isArray(raw)) return branch;

  const employeeMap = new Map<string, BranchEmployee>();
  const emps = branch.employees;
  const empList = Array.isArray(emps) ? emps : emps ? Object.values(emps) : [];
  for (const e of empList) {
    if (e?.id) employeeMap.set(e.id, e);
  }

  const expanded: BranchService[] = [];
  for (const row of raw) {
    const ids =
      Array.isArray(row.employeeIds) && row.employeeIds.length > 0
        ? row.employeeIds
        : row.employee?.id
          ? [row.employee.id]
          : [''];

    for (const eid of ids) {
      const emp = employeeMap.get(eid);
      expanded.push({
        id: row.id,
        name: row.name,
        imageUrl: row.imageUrl ?? null,
        price: row.price,
        duration: row.duration,
        category: row.category ?? { id: '', name: '' },
        employee: {
          id: eid,
          name: emp?.name ?? row.employee?.name ?? '',
        },
      });
    }
  }

  return { ...branch, services: expanded };
}

export async function getBranches(
  token: string,
  options: GetBranchesOptions = {}
): Promise<Branch[]> {
  if (CLIENT_APP_V1_ENABLED) {
    return fetchClientAppV1<Branch[]>('/branches', { apiToken: token });
  }

  const params = new URLSearchParams();
  if (options.includeReviews !== undefined)
    params.set('includeReviews', String(options.includeReviews));
  if (options.reviewsLimit !== undefined) params.set('reviewsLimit', String(options.reviewsLimit));
  const qs = params.toString();

  return fetchCrm<Branch[]>(`/api/client/branches${qs ? `?${qs}` : ''}`, { apiToken: token });
}

/** GET /api/client/branches/:id — detail pobočky včetně služeb. */
export async function getBranchById(token: string, branchId: string): Promise<Branch> {
  if (CLIENT_APP_V1_ENABLED) {
    try {
      const json = await fetchClientAppV1<unknown>(
        `/branches/${encodeURIComponent(branchId)}`,
        { apiToken: token }
      );
      let branch: Branch;
      if (json && typeof json === 'object') {
        const o = json as Record<string, unknown>;
        if (o.branch && typeof o.branch === 'object') branch = o.branch as Branch;
        else if (o.data && typeof o.data === 'object') branch = o.data as Branch;
        else branch = json as Branch;
      } else {
        branch = json as Branch;
      }
      return expandV1BranchServices(branch);
    } catch (e) {
      if (e instanceof CrmHttpError && e.status === 404) throw new Error('Branch not found');
      throw e;
    }
  }

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
