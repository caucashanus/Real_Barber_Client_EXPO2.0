import type { Booking } from '@/api/bookings';
import type { Branch } from '@/api/branches';

type MinimalEmployee = { id: string; name: string; avatarUrl?: string | null };
type MinimalService = {
  id: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  duration: number;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** HH:MM konec = začátek + délka (min), pokud API neposlalo slotEnd. */
function deriveSlotEndTime(
  slotStart: string,
  explicitEnd: string | undefined,
  durationMinutes: number
): string {
  const ex = (explicitEnd ?? '').trim();
  if (ex) return ex;
  const parts = (slotStart || '00:00').trim().split(':');
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return slotStart || '00:00';
  const add = durationMinutes > 0 ? durationMinutes : 30;
  let total = hh * 60 + mm + add;
  if (total >= 24 * 60) total = 24 * 60 - 1;
  const eh = Math.floor(total / 60);
  const em = total % 60;
  return `${pad2(eh)}:${pad2(em)}`;
}

function branchPhone(b: Branch | null): string | undefined {
  if (!b || typeof b !== 'object') return undefined;
  const p = (b as { phone?: unknown }).phone;
  return typeof p === 'string' && p.trim() ? p : undefined;
}

export function buildOptimisticBooking(input: {
  id: string;
  clientId: string;
  employeeId: string;
  branchId: string;
  itemId: string;
  date: string;
  slotStart: string;
  slotEnd?: string;
  duration: number;
  price: number;
  branch: Branch | null;
  employee: MinimalEmployee | null;
  service: MinimalService | null;
}): Booking {
  const duration =
    input.duration > 0
      ? input.duration
      : input.service && input.service.duration > 0
        ? input.service.duration
        : 30;
  const price =
    input.price > 0
      ? input.price
      : input.service && input.service.price > 0
        ? input.service.price
        : 0;
  const slotEnd = deriveSlotEndTime(input.slotStart, input.slotEnd, duration);
  const now = new Date().toISOString();
  const b = input.branch;

  return {
    id: input.id,
    clientId: input.clientId,
    employeeId: input.employeeId,
    branchId: input.branchId,
    itemId: input.itemId,
    date: input.date,
    slotStart: input.slotStart,
    slotEnd,
    duration,
    price,
    status: 'scheduled',
    createdAt: now,
    updatedAt: now,
    employee: {
      id: input.employeeId,
      name: (input.employee?.name ?? '').trim() || '—',
      avatarUrl: input.employee?.avatarUrl ?? null,
    },
    branch: {
      id: input.branchId,
      name: (b?.name ?? '').trim() || '—',
      address: b?.address,
      phone: branchPhone(b),
      imageUrl: b?.imageUrl ?? null,
    },
    item: {
      id: input.itemId,
      name: (input.service?.name ?? '').trim() || '—',
      imageUrl: input.service?.imageUrl ?? null,
    },
  };
}

export function mergeApiBookingWithOptimistic(
  api: Partial<Booking> & { id?: string },
  fallback: Booking
): Booking {
  const id = (api.id && String(api.id)) || fallback.id;
  return {
    ...fallback,
    ...api,
    id,
    employee: api.employee
      ? { ...fallback.employee, ...api.employee, id: api.employee.id ?? fallback.employee.id }
      : fallback.employee,
    branch: api.branch
      ? { ...fallback.branch, ...api.branch, id: api.branch.id ?? fallback.branch.id }
      : fallback.branch,
    item: api.item
      ? { ...fallback.item, ...api.item, id: api.item.id ?? fallback.item.id }
      : fallback.item,
  };
}
