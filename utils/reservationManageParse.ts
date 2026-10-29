import type { BookingManage, BookingManageLifecycle } from '@/api/bookings';

export type ManageAction = 'confirm' | 'reschedule' | 'cancel';

export type ReservationManageInfo = {
  lifecycle: BookingManageLifecycle;
  allowedActions: ManageAction[];
  canManage: boolean;
  message?: string | null;
  timezone?: string | null;
  confirmAvailableFrom?: string | null;
};

export type PublicManagedReservation = {
  id: string;
  status: string;
  date: string;
  slotStart: string;
  slotEnd: string;
  duration: number;
  price: number;
  notes?: string | null;
  bookingReference?: string | null;
  employee: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  branch: {
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
  };
  item: {
    id: string;
    name: string;
    imageUrl?: string | null;
  };
  client?: { id?: string; name?: string | null };
  canManage?: boolean;
  manage: ReservationManageInfo;
};

function trimStr(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t || null;
}

function num(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

export function parseReservationManageInfo(raw: unknown): ReservationManageInfo | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const lifecycle = (trimStr(o.lifecycle) ?? 'confirmed') as BookingManageLifecycle;
  const allowedRaw = o.allowedActions;
  const allowedActions: ManageAction[] = Array.isArray(allowedRaw)
    ? allowedRaw
        .map((a) => (typeof a === 'string' ? a.trim() : ''))
        .filter((a): a is ManageAction => a === 'confirm' || a === 'reschedule' || a === 'cancel')
    : [];
  return {
    lifecycle,
    allowedActions,
    canManage: o.canManage === true,
    message: trimStr(o.message),
    timezone: trimStr(o.timezone),
    confirmAvailableFrom: trimStr(o.confirmAvailableFrom),
  };
}

export function parsePublicManagedReservation(raw: unknown): PublicManagedReservation | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = trimStr(o.id);
  const status = trimStr(o.status);
  const date = trimStr(o.date);
  const slotStart = trimStr(o.slotStart);
  const slotEnd = trimStr(o.slotEnd);
  const employeeRaw =
    o.employee && typeof o.employee === 'object'
      ? (o.employee as Record<string, unknown>)
      : null;
  const branchRaw =
    o.branch && typeof o.branch === 'object' ? (o.branch as Record<string, unknown>) : null;
  const itemRaw = o.item && typeof o.item === 'object' ? (o.item as Record<string, unknown>) : null;
  const employeeId = trimStr(employeeRaw?.id);
  const employeeName = trimStr(employeeRaw?.name);
  const branchId = trimStr(branchRaw?.id);
  const branchName = trimStr(branchRaw?.name);
  const itemId = trimStr(itemRaw?.id);
  const itemName = trimStr(itemRaw?.name);
  const manage = parseReservationManageInfo(o.manage);
  if (
    !id ||
    !status ||
    !date ||
    !slotStart ||
    !slotEnd ||
    !employeeId ||
    !employeeName ||
    !branchId ||
    !branchName ||
    !itemId ||
    !itemName ||
    !manage
  ) {
    return null;
  }

  const clientRaw =
    o.client && typeof o.client === 'object' ? (o.client as Record<string, unknown>) : null;

  return {
    id,
    status,
    date,
    slotStart,
    slotEnd,
    duration: num(o.duration),
    price: num(o.price),
    notes: trimStr(o.notes),
    bookingReference: trimStr(o.bookingReference),
    employee: {
      id: employeeId,
      name: employeeName,
      avatarUrl: trimStr(employeeRaw?.avatarUrl),
    },
    branch: {
      id: branchId,
      name: branchName,
      address: trimStr(branchRaw?.address),
      phone: trimStr(branchRaw?.phone),
    },
    item: {
      id: itemId,
      name: itemName,
      imageUrl: trimStr(itemRaw?.imageUrl),
    },
    client: clientRaw
      ? {
          id: trimStr(clientRaw.id) ?? undefined,
          name: trimStr(clientRaw.name),
        }
      : undefined,
    canManage: o.canManage === true,
    manage: manage as ReservationManageInfo,
  };
}

export function parseManagedReservationEnvelope(
  json: unknown
): { reservation: PublicManagedReservation; message?: string } | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as Record<string, unknown>;
  const reservationRaw = o.reservation ?? o;
  const reservation = parsePublicManagedReservation(reservationRaw);
  if (!reservation) return null;
  return { reservation, message: trimStr(o.message) ?? undefined };
}
