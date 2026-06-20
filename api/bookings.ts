import { CLIENT_APP_V1_ENABLED } from '@/constants/clientAppApi';

import { CrmHttpError, fetchClientAppV1, fetchCrm } from './http';

export { CRM_BASE } from './http';

export interface BookingEmployee {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface BookingBranch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  imageUrl?: string | null;
}

export interface BookingItem {
  id: string;
  name: string;
  imageUrl?: string | null;
}

export interface BookingPayment {
  method?: string | null;
  amount?: number | null;
}

/** Hodnocení klienta v GET /api/client/reservations (vnořený objekt). */
export interface BookingClientReview {
  hasReview: boolean;
  rating: number | null;
  note?: string | null;
}

/** Částky u jednoho použití kupónu u rezervace (GET /api/client/bookings/:id). */
export interface BookingCouponUsageAmounts {
  original: number;
  discount: number;
  final: number;
}

export interface BookingCouponUsageCouponMeta {
  id: string;
  code: string;
  name: string;
  discountType?: string;
  discountValue?: number;
}

export interface BookingCouponUsage {
  id: string;
  appliedAt: string;
  amounts: BookingCouponUsageAmounts;
  coupon: BookingCouponUsageCouponMeta;
}

export interface Booking {
  id: string;
  clientId: string;
  employeeId: string;
  branchId: string;
  itemId: string;
  date: string;
  slotStart: string;
  slotEnd: string;
  duration: number;
  price: number;
  paymentMethod?: string | null;
  payments?: BookingPayment[] | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  employee: BookingEmployee;
  branch: BookingBranch;
  item: BookingItem;
  attachments?: unknown[];
  /** Souhrn recenze klienta k této rezervaci (backend). */
  clientReview?: BookingClientReview | null;
  /** Zastaralé / alternativní pole z API */
  clientReviewRating?: number | null;
  /**
   * Použití kupónů u této rezervace (vždy pole v appce; API může vynechat → []).
   * @see GET /api/client/bookings/:id
   */
  couponUsages?: BookingCouponUsage[];
  totalCash?: number | null;
  totalCard?: number | null;
  totalCoins?: number | null;
}

export interface BookingsPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface BookingsResponse {
  bookings: Booking[];
  pagination: BookingsPagination;
}

/** Zajistí `couponUsages` jako pole (nikdy null/undefined). */
export function normalizeBookingCouponUsages(booking: Booking): Booking {
  return {
    ...booking,
    couponUsages: Array.isArray(booking.couponUsages) ? booking.couponUsages : [],
  };
}

/** CRM vrací `reservations` (nebo legacy `bookings`) — klient vždy pracuje s `bookings`. */
function normalizeBookingsPayload(raw: unknown): BookingsResponse {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const fromBookings = obj.bookings;
  const fromReservations = obj.reservations;
  const list = (
    Array.isArray(fromBookings)
      ? fromBookings
      : Array.isArray(fromReservations)
        ? fromReservations
        : []
  ) as Booking[];
  const normalized = list.map((b) => normalizeBookingCouponUsages(b));
  const pag = obj.pagination;
  const pagination: BookingsPagination =
    pag && typeof pag === 'object'
      ? (pag as BookingsPagination)
      : {
          total: normalized.length,
          limit: normalized.length,
          offset: 0,
          hasMore: false,
        };
  return { bookings: normalized, pagination };
}

/**
 * GET /api/client/bookings/:id — detail rezervace (vč. couponUsages).
 * Tělo: `{ booking: { … } }` nebo `{ data: { booking: … } }`.
 */
export async function getClientBookingById(
  apiToken: string,
  bookingId: string
): Promise<Booking | null> {
  try {
    const raw = await fetchCrm<unknown>(`/api/client/bookings/${encodeURIComponent(bookingId)}`, {
      apiToken,
    });
    if (!raw || typeof raw !== 'object') return null;
    const obj = raw as Record<string, unknown>;
    let inner: unknown = obj.booking;
    if (!inner && typeof obj.data === 'object' && obj.data) {
      const d = obj.data as Record<string, unknown>;
      inner = d.booking ?? null;
    }
    if (!inner || typeof inner !== 'object') return null;
    return normalizeBookingCouponUsages(inner as Booking);
  } catch (e) {
    if (e instanceof CrmHttpError && e.status === 404) return null;
    throw e;
  }
}

export interface GetBookingsOptions {
  status?: string;
  limit?: number;
  offset?: number;
  upcoming?: boolean;
}

export interface CreateBookingBody {
  employeeId: string;
  branchId: string;
  itemId: string;
  date: string; // YYYY-MM-DD
  slotStart: string; // HH:MM
  slotEnd?: string;
  notes?: string;
  couponCode?: string;
}

export interface CreateBookingResponse {
  id?: string;
  booking?: Booking;
  [key: string]: unknown;
}

export async function getBookings(
  apiToken: string,
  options: GetBookingsOptions = {}
): Promise<BookingsResponse> {
  const params = new URLSearchParams();
  if (options.status !== undefined) params.set('status', options.status);
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.offset !== undefined) params.set('offset', String(options.offset));
  if (options.upcoming !== undefined) params.set('upcoming', String(options.upcoming));
  const qs = params.toString();

  const raw = await fetchCrm<unknown>(`/api/client/reservations${qs ? `?${qs}` : ''}`, {
    apiToken,
  });
  return normalizeBookingsPayload(raw);
}

/** Detail rezervace: primárně GET /api/client/bookings/:id, jinak list /api/client/reservations. */
export async function getBookingById(apiToken: string, bookingId: string): Promise<Booking | null> {
  try {
    const direct = await getClientBookingById(apiToken, bookingId);
    if (direct) return direct;
  } catch (e) {
    if (e instanceof Error && e.message === 'Unauthorized') throw e;
  }
  const limit = 100;
  let offset = 0;
  for (;;) {
    const res = await getBookings(apiToken, { limit, offset });
    const found = res.bookings.find((b) => b.id === bookingId) ?? null;
    if (found) return found;
    if (!res.pagination.hasMore) return null;
    offset += limit;
  }
}

/** POST /api/client/bookings – create a new booking for the authenticated client. */
export async function createBooking(
  apiToken: string,
  body: CreateBookingBody
): Promise<CreateBookingResponse> {
  try {
    return await fetchCrm<CreateBookingResponse>('/api/client/bookings', {
      method: 'POST',
      apiToken,
      body,
    });
  } catch (e) {
    if (e instanceof CrmHttpError) {
      if (e.status === 400) throw new Error(e.message || 'Invalid booking data or slot conflict');
      if (e.status === 404) throw new Error('Employee, branch, or service not found');
      if (e.status === 409) throw new Error('Booking conflict or duplicate');
      if (e.status === 500) throw new Error('Failed to create booking');
    }
    throw e;
  }
}

/** Query params for availability. employeeId and date required; branchId and itemId optional. */
export interface GetBookingAvailabilityParams {
  employeeId: string;
  date: string; // YYYY-MM-DD
  branchId?: string;
  itemId?: string;
  /** Přidá cache-busting query param, aby se vždy načetla čerstvá data. */
  noCache?: boolean;
}

/** Response shape from GET /api/client/bookings/availability (see CRM for actual fields). */
export interface BookingAvailabilityResponse {
  date: string;
  employee?: { id: string; name: string };
  service?: { id: string; name: string; duration: number; price: number } | null;
  schedule?: {
    hasDayOff?: boolean;
    shifts?: {
      id?: string;
      branchId?: string;
      startTime?: string;
      endTime?: string;
      source?: string;
    }[];
  };
  workingHours: { start: string; end: string };
  blockedRanges?: {
    type?: string;
    start: string;
    end: string;
    reservationId?: string;
  }[];
  existingBookings: { id: string; start: string; end: string; service?: string }[];
  availability: {
    totalSlots: number;
    slots: { branchId?: string; start: string; end: string; duration: number }[];
  };
  [key: string]: unknown;
}

export interface BookingAvailabilityDayV1 {
  date: string;
  slots: { branchId?: string; start: string; end: string; duration: number }[];
}

export interface BookingAvailabilityMonthResponse {
  year: number;
  month: number;
  days: { date: string; hasSlots: boolean; slotCount?: number }[];
}

export interface GetBookingAvailabilityMonthParams {
  employeeId: string;
  branchId: string;
  itemId: string;
  year: number;
  month: number;
}

function normalizeV1DayAvailability(raw: BookingAvailabilityDayV1): BookingAvailabilityResponse {
  const slots = raw.slots ?? [];
  return {
    date: raw.date,
    workingHours: { start: '', end: '' },
    existingBookings: [],
    availability: {
      totalSlots: slots.length,
      slots,
    },
  };
}

/** GET /api/client/app/v1/bookings/availability/month — one request per calendar month. */
export async function getBookingAvailabilityMonth(
  apiToken: string,
  params: GetBookingAvailabilityMonthParams
): Promise<BookingAvailabilityMonthResponse> {
  const q = new URLSearchParams();
  q.set('employeeId', params.employeeId);
  q.set('branchId', params.branchId);
  q.set('itemId', params.itemId);
  q.set('year', String(params.year));
  q.set('month', String(params.month));

  return fetchClientAppV1<BookingAvailabilityMonthResponse>(
    `/bookings/availability/month?${q.toString()}`,
    { apiToken }
  );
}

/** Available ISO dates in a month (v1: single HTTP; legacy: parallel daily calls). */
export async function fetchAvailableDatesInMonth(
  apiToken: string,
  params: {
    employeeId: string;
    branchId?: string;
    itemId?: string;
    monthOffset: number;
    monthDays: { value: string }[];
  }
): Promise<string[]> {
  const branchId = params.branchId?.trim() ?? '';
  const itemId = params.itemId?.trim() ?? '';

  if (CLIENT_APP_V1_ENABLED && branchId && itemId) {
    const anchor = new Date();
    anchor.setMonth(anchor.getMonth() + params.monthOffset);
    const res = await getBookingAvailabilityMonth(apiToken, {
      employeeId: params.employeeId,
      branchId,
      itemId,
      year: anchor.getFullYear(),
      month: anchor.getMonth() + 1,
    });
    const available = new Set(
      (res.days ?? []).filter((d) => d.hasSlots).map((d) => d.date)
    );
    return params.monthDays
      .map((d) => d.value)
      .filter((v) => available.has(v))
      .sort();
  }

  const values = await Promise.all(
    params.monthDays.map(async (day) => {
      try {
        const res = await getBookingAvailability(apiToken, {
          employeeId: params.employeeId,
          date: day.value,
          branchId: branchId || undefined,
          itemId: itemId || undefined,
          noCache: true,
        });
        const count = res?.availability?.slots?.length ?? 0;
        return count > 0 ? day.value : null;
      } catch {
        return null;
      }
    })
  );
  return values.filter((v): v is string => v != null).sort();
}

/** GET /api/client/bookings/availability – slots for branch + employee. */
export async function getBookingAvailability(
  apiToken: string,
  params: GetBookingAvailabilityParams
): Promise<BookingAvailabilityResponse> {
  const q = new URLSearchParams();
  q.set('employeeId', params.employeeId);
  q.set('date', params.date);
  if (params.branchId) q.set('branchId', params.branchId);
  if (params.itemId) q.set('itemId', params.itemId);
  if (params.noCache && !CLIENT_APP_V1_ENABLED) q.set('_ts', String(Date.now()));

  if (CLIENT_APP_V1_ENABLED) {
    const raw = await fetchClientAppV1<BookingAvailabilityDayV1>(
      `/bookings/availability?${q.toString()}`,
      { apiToken }
    );
    return normalizeV1DayAvailability(raw);
  }

  return fetchCrm<BookingAvailabilityResponse>(
    `/api/client/bookings/availability?${q.toString()}`,
    { apiToken }
  );
}

/** DELETE /api/client/bookings/[id] – cancel a booking for the authenticated client. */
export async function cancelBooking(
  apiToken: string,
  bookingId: string,
  reason?: string
): Promise<{ cancelled: true }> {
  try {
    const result = await fetchCrm<{ cancelled: true } | undefined>(
      `/api/client/bookings/${encodeURIComponent(bookingId)}`,
      {
        method: 'DELETE',
        apiToken,
        body: reason != null && reason.trim() !== '' ? { reason: reason.trim() } : undefined,
      }
    );
    return result ?? { cancelled: true };
  } catch (e) {
    if (e instanceof CrmHttpError) {
      if (e.status === 403)
        throw new Error('Rezervaci nelze zrušit méně než 2 hodiny před domluveným termínem.');
      if (e.status === 404) throw new Error('Booking not found');
      if (e.status === 500) throw new Error('Failed to cancel booking');
    }
    throw e;
  }
}

/** PATCH /api/client/bookings/{id} – update booking (all body fields optional). */
export interface UpdateBookingBody {
  branchId?: string;
  date?: string;
  employeeId?: string;
  itemId?: string;
  notes?: string;
  slotEnd?: string;
  slotStart?: string;
}

export interface UpdateBookingResponse {
  message?: string;
  status?: number;
  booking?: Booking;
  [key: string]: unknown;
}

export async function updateBooking(
  apiToken: string,
  bookingId: string,
  body: UpdateBookingBody
): Promise<UpdateBookingResponse> {
  const payload: Record<string, string> = {};
  (Object.entries(body) as [keyof UpdateBookingBody, string | undefined][]).forEach(
    ([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        payload[key as string] = String(value).trim();
      }
    }
  );

  try {
    const result = await fetchCrm<UpdateBookingResponse>(
      `/api/client/bookings/${encodeURIComponent(bookingId)}`,
      { method: 'PATCH', apiToken, body: payload }
    );
    return result ?? {};
  } catch (e) {
    if (e instanceof CrmHttpError) {
      if (e.status === 403)
        throw new Error('Rezervaci nelze upravit méně než 1 hodinu před domluveným termínem.');
      if (e.status === 404) throw new Error('Booking not found');
      if (e.status === 400) throw new Error('Invalid booking data or slot conflict');
      if (e.status === 409) throw new Error('Booking conflict');
      if (e.status === 500) throw new Error('Failed to update booking');
    }
    throw e;
  }
}
