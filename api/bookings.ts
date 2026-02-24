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
