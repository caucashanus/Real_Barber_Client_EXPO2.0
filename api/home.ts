import type { Booking } from '@/api/bookings';
import { normalizeBookingCouponUsages } from '@/api/bookings';
import type { ClientCoupon } from '@/api/client-coupons';
import type { ClientPoster } from '@/api/client-posters';
import { CrmHttpError, fetchCrm } from '@/api/http';
import type {
  HomepageEmployeeAvailability,
  HomepageTodayTeamMember,
} from '@/api/homeTeamTypes';
import { HOME_AVAILABILITY_SERVICE_ID } from '@/constants/teamMemberPage';

export interface HomeResponseMeta {
  generatedAt?: string;
  date: string;
  serviceId: string;
  timezone?: string;
  locale?: string;
  authenticated: boolean;
}

export interface HomeResponse {
  meta: HomeResponseMeta;
  todayTeam: HomepageTodayTeamMember[];
  availability: HomepageEmployeeAvailability[];
  posters: ClientPoster[];
  coupons: ClientCoupon[];
  bookings: Booking[];
}

export interface GetHomeOptions {
  date: string;
  serviceId?: string;
  locale?: string;
  apiToken?: string | null;
}

export const EMPTY_HOME_RESPONSE: HomeResponse = {
  meta: {
    date: '',
    serviceId: '',
    timezone: 'Europe/Prague',
    locale: 'cs',
    authenticated: false,
  },
  todayTeam: [],
  availability: [],
  posters: [],
  coupons: [],
  bookings: [],
};

function normalizeHomeResponse(raw: HomeResponse | null | undefined): HomeResponse {
  if (!raw) return EMPTY_HOME_RESPONSE;
  return {
    meta: raw.meta ?? EMPTY_HOME_RESPONSE.meta,
    todayTeam: Array.isArray(raw.todayTeam) ? raw.todayTeam : [],
    availability: Array.isArray(raw.availability) ? raw.availability : [],
    posters: Array.isArray(raw.posters) ? raw.posters : [],
    coupons: Array.isArray(raw.coupons) ? raw.coupons : [],
    bookings: Array.isArray(raw.bookings)
      ? raw.bookings.map((booking) => normalizeBookingCouponUsages(booking))
      : [],
  };
}

/** GET /api/home — unified homepage (optional Bearer, invalid token = guest). */
export async function getHome(options: GetHomeOptions): Promise<HomeResponse> {
  const params = new URLSearchParams({ date: options.date });
  const serviceId = options.serviceId ?? HOME_AVAILABILITY_SERVICE_ID;
  if (serviceId) params.set('serviceId', serviceId);
  if (options.locale) params.set('locale', options.locale);

  const path = `/api/home?${params.toString()}`;

  try {
    const data = await fetchCrm<HomeResponse>(path, {
      apiToken: options.apiToken ?? undefined,
      checkAuth: false,
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-store',
      },
    });
    return normalizeHomeResponse(data);
  } catch (error) {
    if (error instanceof CrmHttpError && error.status === 401 && options.apiToken) {
      const data = await fetchCrm<HomeResponse>(path, {
        checkAuth: false,
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-store',
        },
      });
      return normalizeHomeResponse(data);
    }
    throw error;
  }
}
