import { fetchCrm } from './http';

/** CRM GET/PUT `/api/client/visit-plan` */
export type ClientVisitPlan = {
  intervalDays: number | null;
  remindersEnabled: boolean | null;
  lastCompletedVisitDate: string | null;
  nextTargetVisitDate: string | null;
  updatedAt: string | null;
};

/** Dočasná zpětná kompatibilita GET (CRM může poslat stará pole). */
export type ClientVisitPlanRaw = ClientVisitPlan & {
  remindBySms?: boolean | null;
  remindByPhone?: boolean | null;
};

export type ClientVisitPlanPutBody = {
  intervalDays: number;
  remindersEnabled?: boolean;
};

export const CLIENT_VISIT_PLAN_INTERVAL_DAYS_MIN = 1;
export const CLIENT_VISIT_PLAN_INTERVAL_DAYS_MAX = 70;

export function normalizeClientVisitPlan(raw: ClientVisitPlanRaw): ClientVisitPlan {
  let remindersEnabled = raw.remindersEnabled;
  if (remindersEnabled !== true && remindersEnabled !== false) {
    const sms = raw.remindBySms;
    const phone = raw.remindByPhone;
    if (sms === true || sms === false || phone === true || phone === false) {
      remindersEnabled = sms === true || phone === true;
    } else {
      remindersEnabled = null;
    }
  }

  return {
    intervalDays: raw.intervalDays ?? null,
    remindersEnabled,
    lastCompletedVisitDate: raw.lastCompletedVisitDate ?? null,
    nextTargetVisitDate: raw.nextTargetVisitDate ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}

export async function getClientVisitPlan(apiToken: string): Promise<ClientVisitPlan> {
  const raw = await fetchCrm<ClientVisitPlanRaw>('/api/client/visit-plan', { apiToken });
  return normalizeClientVisitPlan(raw);
}

export async function putClientVisitPlan(
  apiToken: string,
  body: ClientVisitPlanPutBody
): Promise<ClientVisitPlan> {
  const raw = await fetchCrm<ClientVisitPlanRaw>('/api/client/visit-plan', {
    apiToken,
    method: 'PUT',
    body,
  });
  return normalizeClientVisitPlan(raw);
}
