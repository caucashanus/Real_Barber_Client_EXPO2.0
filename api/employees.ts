import { CrmHttpError, fetchCrm } from './http';

export interface Employee {
  id: string;
  name: string;
  email?: string;
  description?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  assignedAt?: string;
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
}

export async function getEmployees(
  apiToken: string,
  options: GetEmployeesOptions = {}
): Promise<Employee[]> {
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
  try {
    return await fetchCrm<EmployeeDetail>(
      `/api/client/employees/${encodeURIComponent(employeeId)}`,
      { apiToken }
    );
  } catch (e) {
    if (e instanceof CrmHttpError && e.status === 404) throw new Error('Employee not found');
    throw e;
  }
}
