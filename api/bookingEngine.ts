import { CRM_BASE } from '@/api/http';
import { BookingApiError } from '@/lib/booking/booking-api/errors';
import { getBookingSessionId } from '@/lib/booking/booking-api/session';
import type {
  BookingBootstrapResponse,
  BookingBranchCatalogResponse,
  BookingCalendarMultiBranchResponse,
  BookingCalendarResponse,
  BookingCreateReservationResponse,
  BookingEmployeePickerResponse,
  BookingEmployeeProfileResponse,
  BookingHoldResponse,
  BookingOtpRequestResult,
  BookingServiceContextResponse,
  BookingSlotServicesResponse,
} from '@/lib/booking/booking-api/types';

const BOOKING_API_PREFIX = '/api/booking';

type FetchOptions = {
  locale?: string;
  apiToken?: string | null;
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
};

function withHoldId(
  params: Record<string, string | number | undefined>,
  holdId?: string | null
): Record<string, string | number | undefined> {
  if (holdId) return { ...params, holdId };
  return params;
}

async function bookingFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { locale, apiToken, method = 'GET', body } = options;
  const url = new URL(`${CRM_BASE}${BOOKING_API_PREFIX}${path}`);
  if (locale) {
    url.searchParams.set('locale', locale);
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Booking-Session-Id': getBookingSessionId(),
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  if (apiToken) {
    headers.Authorization = `Bearer ${apiToken}`;
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const record = (data ?? {}) as { error?: string; message?: string };
    const message =
      typeof record.error === 'string'
        ? record.error
        : typeof record.message === 'string'
          ? record.message
          : `Booking API ${res.status}`;
    throw new BookingApiError(message, res.status, data);
  }

  return data as T;
}

function q(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

export function getBookingBootstrap(locale?: string, apiToken?: string | null) {
  return bookingFetch<BookingBootstrapResponse>(`/bootstrap${q({ locale })}`, {
    locale,
    apiToken,
  });
}

export function getBookingBranchCatalog(
  branchId: string,
  locale?: string,
  apiToken?: string | null
) {
  return bookingFetch<BookingBranchCatalogResponse>(
    `/branch-catalog${q({ branchId, locale })}`,
    { locale, apiToken }
  );
}

export function getBookingEmployeePicker(
  params: {
    branchId: string;
    itemId: string;
    locale?: string;
    fromDate?: string;
    maxDays?: number;
    holdId?: string | null;
  },
  apiToken?: string | null
) {
  return bookingFetch<BookingEmployeePickerResponse>(
    `/employee-picker${q(
      withHoldId(
        {
          branchId: params.branchId,
          itemId: params.itemId,
          locale: params.locale,
          fromDate: params.fromDate,
          maxDays: params.maxDays,
        },
        params.holdId
      )
    )}`,
    { locale: params.locale, apiToken }
  );
}

export function getBookingCalendar(
  params: {
    branchId: string;
    itemId: string;
    employeeId: string;
    from: string;
    days?: number;
    locale?: string;
    holdId?: string | null;
  },
  apiToken?: string | null
) {
  return bookingFetch<BookingCalendarResponse>(
    `/calendar${q(
      withHoldId(
        {
          branchId: params.branchId,
          itemId: params.itemId,
          employeeId: params.employeeId,
          from: params.from,
          days: params.days ?? 42,
          locale: params.locale,
        },
        params.holdId
      )
    )}`,
    { locale: params.locale, apiToken }
  );
}

export function getBookingCalendarMultiBranch(
  params: {
    employeeId: string;
    itemId: string;
    from: string;
    days?: number;
    branchIds?: string[];
    locale?: string;
    holdId?: string | null;
  },
  apiToken?: string | null
) {
  return bookingFetch<BookingCalendarMultiBranchResponse>(
    `/calendar-multi-branch${q(
      withHoldId(
        {
          employeeId: params.employeeId,
          itemId: params.itemId,
          from: params.from,
          days: params.days ?? 42,
          branchIds: params.branchIds?.join(','),
          locale: params.locale,
        },
        params.holdId
      )
    )}`,
    { locale: params.locale, apiToken }
  );
}

export function getBookingEmployeeProfile(
  params: { slug?: string; employeeId?: string; locale?: string },
  apiToken?: string | null
) {
  return bookingFetch<BookingEmployeeProfileResponse>(
    `/employee-profile${q({
      slug: params.slug,
      employeeId: params.employeeId,
      locale: params.locale,
    })}`,
    { locale: params.locale, apiToken }
  );
}

export function getBookingServiceContext(
  params: { slug?: string; itemId?: string; locale?: string },
  apiToken?: string | null
) {
  return bookingFetch<BookingServiceContextResponse>(
    `/service-context${q({
      slug: params.slug,
      itemId: params.itemId,
      locale: params.locale,
    })}`,
    { locale: params.locale, apiToken }
  );
}

export function getBookingSlotServices(
  params: {
    employeeId: string;
    branchId: string;
    date: string;
    slotStart: string;
    slotEnd?: string;
    categoryId?: string;
    locale?: string;
    holdId?: string | null;
  },
  apiToken?: string | null
) {
  return bookingFetch<BookingSlotServicesResponse>(
    `/slot-services${q(
      withHoldId(
        {
          employeeId: params.employeeId,
          branchId: params.branchId,
          date: params.date,
          slotStart: params.slotStart,
          slotEnd: params.slotEnd,
          categoryId: params.categoryId,
          locale: params.locale,
        },
        params.holdId
      )
    )}`,
    { locale: params.locale, apiToken }
  );
}

export type BookingHoldCreateBody = {
  branchId: string;
  itemId: string;
  employeeId: string;
  date: string;
  slotStart: string;
  slotEnd: string;
};

export function createBookingHold(body: BookingHoldCreateBody, apiToken?: string | null) {
  return bookingFetch<{ hold: BookingHoldResponse }>('/holds', {
    method: 'POST',
    body,
    apiToken,
  });
}

export function extendBookingHold(holdId: string, apiToken?: string | null) {
  return bookingFetch<{ hold: BookingHoldResponse }>('/holds', {
    method: 'POST',
    body: { action: 'extend', holdId },
    apiToken,
  });
}

export function releaseBookingHold(holdId: string, apiToken?: string | null) {
  return bookingFetch<{ ok?: boolean }>('/holds', {
    method: 'POST',
    body: { action: 'release', holdId },
    apiToken,
  });
}

export function requestBookingApiOtp(phone: string) {
  return bookingFetch<BookingOtpRequestResult>('/reservations/otp/request', {
    method: 'POST',
    body: { phone },
  });
}

export function createBookingApiReservation(
  body: Record<string, unknown>,
  apiToken?: string | null
) {
  const payload = { ...body };
  if ('serviceId' in payload && !('itemId' in payload)) {
    payload.itemId = payload.serviceId;
    delete payload.serviceId;
  }
  if ('otpChallengeToken' in payload && !('challengeToken' in payload)) {
    payload.challengeToken = payload.otpChallengeToken;
    delete payload.otpChallengeToken;
  }
  return bookingFetch<BookingCreateReservationResponse>('/reservations', {
    method: 'POST',
    body: payload,
    apiToken,
  });
}

export async function loadBookingEmployeesWithNearestSlots(params: {
  branchId?: string;
  itemId?: string;
  locale?: string;
  apiToken?: string | null;
}) {
  const { branchId, itemId, locale, apiToken } = params;
  if (!branchId || !itemId) {
    return { employees: [], nearestSlots: {} as Record<string, { date: string; start: string } | null> };
  }

  const data = await getBookingEmployeePicker(
    { branchId, itemId, locale, maxDays: 14 },
    apiToken
  );

  const { mapPickerEmployeeToEntity } = await import('@/lib/booking/booking-api/mappers');
  const employees = data.employees.map(mapPickerEmployeeToEntity);
  const nearestSlots: Record<string, { date: string; start: string } | null> = {};
  for (const row of data.employees) {
    nearestSlots[row.id] = row.nearestSlot
      ? { date: row.nearestSlot.date.slice(0, 10), start: row.nearestSlot.start }
      : null;
  }
  return { employees, nearestSlots };
}
