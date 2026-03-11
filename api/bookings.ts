const CRM_BASE = 'https://crm.xrb.cz';

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
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  employee: BookingEmployee;
  branch: BookingBranch;
  item: BookingItem;
  attachments?: unknown[];
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

export interface GetBookingsOptions {
  status?: string;
  limit?: number;
  offset?: number;
  upcoming?: boolean;
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
  const url = `${CRM_BASE}/api/client/bookings${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<BookingsResponse>;
}

/** Query params for availability. employeeId and date required; branchId and itemId optional. */
export interface GetBookingAvailabilityParams {
  employeeId: string;
  date: string; // YYYY-MM-DD
  branchId?: string;
  itemId?: string;
}

/** Response shape from GET /api/client/bookings/availability (see CRM for actual fields). */
export interface BookingAvailabilityResponse {
  date: string;
  employee: { id: string; name: string };
  service: { id: string; name: string; duration: number; price: number } | null;
  workingHours: { start: string; end: string };
  existingBookings: Array<{ id: string; start: string; end: string; service?: string }>;
  availability: { totalSlots: number; slots: Array<{ start: string; end: string; duration: number }> };
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
  const url = `${CRM_BASE}/api/client/bookings/availability?${q.toString()}`;

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
    body: reason != null && reason.trim() !== '' ? JSON.stringify({ reason: reason.trim() }) : undefined,
  });
  const text = await res.text();
  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 403) throw new Error('Cannot cancel booking (wrong owner or status)');
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
