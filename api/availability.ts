const CRM_BASE = 'https://crm.xrb.cz';

export interface EmployeesNearestNextSlot {
  date: string;
  slotStart: string;
  slotEnd: string;
  duration: number;
  branchId: string;
}

export interface EmployeesNearestEmployeeRow {
  employee: { id: string; name: string; avatarUrl?: string | null };
  price: number;
  duration: number;
  service: { id: string; name: string };
  nextSlot: EmployeesNearestNextSlot | null;
}

export interface EmployeesNearestResponse {
  branch: { id: string; name: string; address?: string; phone?: string };
  item: {
    id: string;
    name: string;
    imageUrl?: string | null;
    description?: string;
  };
  fromDate: string;
  maxDays: number;
  employees: EmployeesNearestEmployeeRow[];
}

export interface GetEmployeesNearestParams {
  branchId: string;
  itemId: string;
  fromDate?: string;
  maxDays?: number;
  employeeLimit?: number;
}

/** GET /api/client/availability/employees-nearest */
export async function getEmployeesNearest(
  apiToken: string,
  params: GetEmployeesNearestParams
): Promise<EmployeesNearestResponse> {
  const q = new URLSearchParams();
  q.set('branchId', params.branchId);
  q.set('itemId', params.itemId);
  if (params.fromDate) q.set('fromDate', params.fromDate);
  if (params.maxDays != null) q.set('maxDays', String(params.maxDays));
  if (params.employeeLimit != null) q.set('employeeLimit', String(params.employeeLimit));

  const url = `${CRM_BASE}/api/client/availability/employees-nearest?${q.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  const text = await res.text();
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const body = JSON.parse(text) as { message?: string; error?: string };
      if (body?.message) msg = body.message;
      else if (body?.error) msg = body.error;
      else if (text) msg = `${msg}: ${text.slice(0, 200)}`;
    } catch {
      if (text) msg = `${msg}: ${text.slice(0, 200)}`;
    }
    throw new Error(msg);
  }

  return JSON.parse(text) as EmployeesNearestResponse;
}
