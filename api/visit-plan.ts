import { fetchCrm } from './http';

/** CRM GET/PUT `/api/client/visit-plan` */
export type ClientVisitPlan = {
  intervalDays: number | null;
  remindBySms: boolean | null;
  remindByPhone: boolean | null;
  lastCompletedVisitDate: string | null;
  nextTargetVisitDate: string | null;
  updatedAt: string | null;
};

export type ClientVisitPlanPutBody = {
  intervalDays: number;
  remindBySms: boolean;
  remindByPhone: boolean;
};

export const CLIENT_VISIT_PLAN_INTERVAL_DAYS_MIN = 1;
export const CLIENT_VISIT_PLAN_INTERVAL_DAYS_MAX = 70;

export async function getClientVisitPlan(apiToken: string): Promise<ClientVisitPlan> {
  return fetchCrm<ClientVisitPlan>('/api/client/visit-plan', { apiToken });
}

export async function putClientVisitPlan(
  apiToken: string,
  body: ClientVisitPlanPutBody
): Promise<ClientVisitPlan> {
  return fetchCrm<ClientVisitPlan>('/api/client/visit-plan', {
    apiToken,
    method: 'PUT',
    body,
  });
}
