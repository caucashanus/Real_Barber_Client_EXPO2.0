import { checkAuthResponse } from './http';
export const CRM_BASE = 'https://crm.xrb.cz';

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
  const list = (Array.isArray(fromBookings)
    ? fromBookings
    : Array.isArray(fromReservations)
      ? fromReservations
      : []) as Booking[];
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
  const url = `${CRM_BASE}/api/client/bookings/${encodeURIComponent(bookingId)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });
  const text = await res.text();
  checkAuthResponse(res);
  if (res.status === 404) return null;
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const parsed = JSON.parse(text) as { message?: string; error?: string };
      if (parsed?.message) msg = parsed.message;
      else if (typeof parsed?.error === 'string') msg = parsed.error;
      else if (text) msg = `${msg}: ${text.slice(0, 200)}`;
    } catch {
      if (text) msg = `${msg}: ${text.slice(0, 200)}`;
    }
    throw new Error(msg);
  }
  if (!text) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  let inner: unknown = obj.booking;
  if (!inner && typeof obj.data === 'object' && obj.data) {
    const d = obj.data as Record<string, unknown>;
    inner = d.booking ?? null;
  }
  if (!inner || typeof inner !== 'object') return null;
  return normalizeBookingCouponUsages(inner as Booking);
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
  const url = `${CRM_BASE}/api/client/reservations${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });

  checkAuthResponse(res);
  if (!res.ok) throw new Error(`Error ${res.status}`);

  const raw = await res.json();
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
  const url = `${CRM_BASE}/api/client/bookings`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  checkAuthResponse(res);
  if (res.status === 400) {
    let msg = 'Invalid booking data or slot conflict';
    try {
      const parsed = JSON.parse(text) as { message?: string; error?: string };
      if (parsed?.message) msg = parsed.message;
      else if (typeof parsed?.error === 'string') msg = parsed.error;
      else if (text) msg = `${msg}: ${text.slice(0, 200)}`;
    } catch {
      if (text) msg = `${msg}: ${text.slice(0, 200)}`;
    }
    throw new Error(msg);
  }
  if (res.status === 404) throw new Error('Employee, branch, or service not found');
  if (res.status === 409) throw new Error('Booking conflict or duplicate');
  if (res.status === 500) throw new Error('Failed to create booking');
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const parsed = JSON.parse(text) as { message?: string; error?: string };
      if (parsed?.message) msg = parsed.message;
      else if (parsed?.error) msg = parsed.error;
    } catch {
      if (text) msg = `${msg}: ${text.slice(0, 200)}`;
    }
    throw new Error(msg);
  }

  if (!text) return {};
  return JSON.parse(text) as CreateBookingResponse;
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
  employee: { id: string; name: string };
  service: { id: string; name: string; duration: number; price: number } | null;
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
  if (params.noCache) q.set('_ts', String(Date.now()));
  const url = `${CRM_BASE}/api/client/bookings/availability?${q.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  const text = await res.text();
  checkAuthResponse(res);
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

  return JSON.parse(text) as BookingAvailabilityResponse;
}

/** DELETE /api/client/bookings/[id] – cancel a booking for the authenticated client. */
export async function cancelBooking(
  apiToken: string,
  bookingId: string,
  reason?: string
): Promise<{ cancelled: true }> {
  const url = `${CRM_BASE}/api/client/bookings/${encodeURIComponent(bookingId)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body:
      reason != null && reason.trim() !== ''
        ? JSON.stringify({ reason: reason.trim() })
        : undefined,
  });
  const text = await res.text();
  checkAuthResponse(res);
  if (res.status === 403)
    throw new Error('Rezervaci nelze zrušit méně než 2 hodiny před domluveným termínem.');
  if (res.status === 404) throw new Error('Booking not found');
  if (res.status === 500) throw new Error('Failed to cancel booking');
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const body = JSON.parse(text) as { message?: string; error?: string };
      if (body?.message) msg = body.message;
      else if (body?.error) msg = body.error;
    } catch {
      if (text) msg = `${msg}: ${text.slice(0, 200)}`;
    }
    throw new Error(msg);
  }
  return text ? (JSON.parse(text) as { cancelled: true }) : { cancelled: true };
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

  const url = `${CRM_BASE}/api/client/bookings/${encodeURIComponent(bookingId)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  checkAuthResponse(res);
  if (res.status === 403)
    throw new Error('Rezervaci nelze upravit méně než 1 hodinu před domluveným termínem.');
  if (res.status === 404) throw new Error('Booking not found');
  if (res.status === 400) throw new Error('Invalid booking data or slot conflict');
  if (res.status === 409) throw new Error('Booking conflict');
  if (res.status === 500) throw new Error('Failed to update booking');
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const parsed = JSON.parse(text) as { message?: string; error?: string };
      if (parsed?.message) msg = parsed.message;
      else if (parsed?.error) msg = parsed.error;
      else if (text) msg = `${msg}: ${text.slice(0, 200)}`;
    } catch {
      if (text) msg = `${msg}: ${text.slice(0, 200)}`;
    }
    throw new Error(msg);
  }

  if (!text) return { status: res.status };
  try {
    return JSON.parse(text) as UpdateBookingResponse;
  } catch {
    return { status: res.status };
  }
}
