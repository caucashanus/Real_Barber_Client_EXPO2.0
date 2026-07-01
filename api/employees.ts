import { CLIENT_APP_V1_ENABLED } from '@/constants/clientAppApi';

import { CrmHttpError, fetchClientAppV1, fetchCrm } from './http';

export interface EmployeeShiftBranch {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  name: string;
  email?: string;
  description?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  assignedAt?: string;
  hasShiftToday?: boolean;
  /** Present when GET /employees is called with shiftDate (v1). */
  hasShiftOnDate?: boolean;
  shiftBranchIds?: string[];
  shiftBranches?: EmployeeShiftBranch[];
  averageRating?: number;
  reviewCount?: number;
  branchIds?: string[];
  media?: EmployeeMediaItem[] | Record<string, EmployeeMediaItem>;
  [key: string]: unknown;
}

export interface EmployeeMediaItem {
  id?: string;
  url: string;
  type?: 'image' | 'video';
  order?: number;
  title?: string | null;
  [key: string]: unknown;
}

export interface GetEmployeesOptions {
  includeReviews?: boolean;
  reviewsLimit?: number;
  bookableOnly?: boolean;
  /** v1 — YYYY-MM-DD; returns hasShiftOnDate + shiftBranches per employee. */
  shiftDate?: string;
  /** v1 — filter to employees with a shift at this branch on shiftDate. */
  branchId?: string;
}

export async function getEmployees(
  apiToken: string,
  options: GetEmployeesOptions = {}
): Promise<Employee[]> {
  if (CLIENT_APP_V1_ENABLED) {
    const params = new URLSearchParams();
    if (options.bookableOnly) params.set('bookableOnly', 'true');
    if (options.shiftDate) params.set('shiftDate', options.shiftDate);
    if (options.branchId) params.set('branchId', options.branchId);
    const qs = params.toString();
    return fetchClientAppV1<Employee[]>(`/employees${qs ? `?${qs}` : ''}`, { apiToken });
  }

  const params = new URLSearchParams();
  if (options.includeReviews !== undefined)
    params.set('includeReviews', String(options.includeReviews));
  if (options.reviewsLimit !== undefined) params.set('reviewsLimit', String(options.reviewsLimit));
  const qs = params.toString();

  return fetchCrm<Employee[]>(`/api/client/employees${qs ? `?${qs}` : ''}`, { apiToken });
}

export interface EmployeeBranch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  imageUrl?: string | null;
  isActive?: boolean;
  assignedAt?: string;
  [key: string]: unknown;
}

export interface EmployeeService {
  id: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  duration: number;
  category: { id: string; name: string };
  [key: string]: unknown;
}

export interface EmployeeDetail extends Employee {
  branches?: EmployeeBranch[] | Record<string, EmployeeBranch>;
  services?: EmployeeService[] | Record<string, EmployeeService>;
  workSchedule?: unknown;
  availability?: unknown;
}

export async function getEmployeeById(
  apiToken: string,
  employeeId: string
): Promise<EmployeeDetail> {
  const path = CLIENT_APP_V1_ENABLED
    ? `/employees/${encodeURIComponent(employeeId)}`
    : `/api/client/employees/${encodeURIComponent(employeeId)}`;
  const fetcher = CLIENT_APP_V1_ENABLED ? fetchClientAppV1 : fetchCrm;

  try {
    return await fetcher<EmployeeDetail>(path, { apiToken });
  } catch (e) {
    if (e instanceof CrmHttpError && e.status === 404) throw new Error('Employee not found');
    throw e;
  }
}
