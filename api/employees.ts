const CRM_BASE = 'https://crm.xrb.cz';

export interface Employee {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  isActive?: boolean;
  assignedAt?: string;
  media?: Array<{ url: string }> | Record<string, { url: string }>;
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
  if (options.includeReviews !== undefined) params.set('includeReviews', String(options.includeReviews));
  if (options.reviewsLimit !== undefined) params.set('reviewsLimit', String(options.reviewsLimit));
  const qs = params.toString();
  const url = `${CRM_BASE}/api/client/employees${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<Employee[]>;
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

export async function getEmployeeById(apiToken: string, employeeId: string): Promise<EmployeeDetail> {
  const url = `${CRM_BASE}/api/client/employees/${encodeURIComponent(employeeId)}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 404) throw new Error('Employee not found');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<EmployeeDetail>;
}
