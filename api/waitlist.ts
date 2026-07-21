import { fetchCrm } from './http';

import { HOME_AVAILABILITY_SERVICE_ID } from '@/constants/teamMemberPage';

export interface JoinEmployeeWaitlistParams {
  employeeId: string;
  branchId?: string;
  serviceId?: string;
  date?: string;
}

/** POST /api/client/waitlist — join waitlist for an employee when today is fully booked. */
export async function joinEmployeeWaitlist(
  apiToken: string,
  params: JoinEmployeeWaitlistParams
): Promise<void> {
  await fetchCrm('/api/client/waitlist', {
    method: 'POST',
    apiToken,
    body: {
      employeeId: params.employeeId,
      branchId: params.branchId,
      serviceId: params.serviceId ?? HOME_AVAILABILITY_SERVICE_ID,
      date: params.date,
    },
  });
}
