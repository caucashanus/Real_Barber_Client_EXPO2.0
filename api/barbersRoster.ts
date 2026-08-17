import { CrmHttpError, fetchCrm } from '@/api/http';
import { HOME_AVAILABILITY_SERVICE_ID } from '@/constants/teamMemberPage';

export interface BarberRosterSlot {
  date: string;
  time: string;
  endTime: string;
  duration: number;
  branchId: string;
}

export interface BarberRosterWorkInterval {
  branchId: string;
  startTime: string;
  endTime: string;
}

export interface BarberRosterBranch {
  id: string;
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
  address?: string | null;
  addressEn?: string | null;
  addressUk?: string | null;
}

export interface BarberRosterDayEntry {
  workIntervals: BarberRosterWorkInterval[];
  slots: BarberRosterSlot[];
}

export interface BarberRosterEmployee {
  id: string;
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
  avatarUrl?: string | null;
  avatarAlt?: string | null;
  avatarAltEn?: string | null;
  avatarAltUk?: string | null;
  webUrl?: string | null;
  webUrlEn?: string | null;
  webUrlUk?: string | null;
  branches: BarberRosterBranch[];
  nextSlots: BarberRosterSlot[];
  byDate: Record<string, BarberRosterDayEntry>;
  isNew?: boolean;
}

export interface BarberRosterResponse {
  meta: {
    generatedAt?: string;
    date: string;
    days: number;
    serviceId: string;
    timezone?: string;
    locale?: string;
  };
  days: Array<{ date: string }>;
  employees: BarberRosterEmployee[];
}

export interface GetBarbersRosterOptions {
  date?: string;
  days?: number;
  serviceId?: string;
  locale?: string;
  apiToken?: string | null;
}

export const EMPTY_BARBER_ROSTER: BarberRosterResponse = {
  meta: {
    generatedAt: '',
    date: '',
    days: 0,
    serviceId: '',
    timezone: 'Europe/Prague',
  },
  days: [],
  employees: [],
};

/** GET /api/barbers/roster — offers styl, optional Bearer (neplatný token = guest). */
export async function getBarbersRoster(
  options: GetBarbersRosterOptions = {}
): Promise<BarberRosterResponse> {
  const params = new URLSearchParams();
  if (options.date) params.set('date', options.date);
  params.set('days', String(options.days ?? 7));
  const serviceId = options.serviceId ?? HOME_AVAILABILITY_SERVICE_ID;
  if (serviceId) params.set('serviceId', serviceId);
  if (options.locale) params.set('locale', options.locale);

  const path = `/api/barbers/roster?${params.toString()}`;

  try {
    const data = await fetchCrm<BarberRosterResponse>(path, {
      apiToken: options.apiToken ?? undefined,
      checkAuth: false,
    });
    return data ?? EMPTY_BARBER_ROSTER;
  } catch (error) {
    if (error instanceof CrmHttpError && error.status === 401 && options.apiToken) {
      const data = await fetchCrm<BarberRosterResponse>(path, { checkAuth: false });
      return data ?? EMPTY_BARBER_ROSTER;
    }
    throw error;
  }
}
