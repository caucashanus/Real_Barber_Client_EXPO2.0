import type { BookingEntity, BookingService } from '@/lib/booking/constants';

export type ResolvedBookingPrice = {
  amount: number | null;
  kind: 'exact' | 'from';
};

export type ResolveBookingPriceInput = {
  employee?: BookingEntity | null;
  service?: BookingService | null;
  branch?: BookingEntity | null;
  /** priceFrom pobočky pro aktuální serviceId (branch-catalog mapa). */
  branchPriceForService?: number | null;
};

export function isValidBookingPrice(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function readEmployeePrice(employee: BookingEntity | null | undefined): number | null {
  if (!employee) return null;
  const raw = employee.price;
  return isValidBookingPrice(raw) ? raw : null;
}

function readBranchPriceFrom(branch: BookingEntity | null | undefined): number | null {
  if (!branch) return null;
  const raw = branch.priceFrom;
  return isValidBookingPrice(raw) ? raw : null;
}

function readServicePrice(service: BookingService | null | undefined): ResolvedBookingPrice | null {
  const pricing = service?.pricing;
  if (!pricing || !isValidBookingPrice(pricing.minPrice)) return null;
  return {
    amount: pricing.minPrice,
    kind: pricing.kind === 'exact' ? 'exact' : 'from',
  };
}

/**
 * Jedna zdrojová pravda pro cenu ve shrnutí / kontaktu (priorita 1→4 dle web spec).
 */
export function resolveBookingPrice(input: ResolveBookingPriceInput): ResolvedBookingPrice {
  const employeePrice = readEmployeePrice(input.employee);
  if (employeePrice != null) {
    return { amount: employeePrice, kind: 'exact' };
  }

  if (isValidBookingPrice(input.branchPriceForService)) {
    return { amount: input.branchPriceForService, kind: 'from' };
  }

  const branchPriceFrom = readBranchPriceFrom(input.branch);
  if (branchPriceFrom != null) {
    return { amount: branchPriceFrom, kind: 'from' };
  }

  const servicePrice = readServicePrice(input.service);
  if (servicePrice != null) {
    return servicePrice;
  }

  return { amount: null, kind: 'from' };
}

export function branchPriceForServiceId(
  serviceId: string | null | undefined,
  branchMinPrices: Record<string, number>
): number | null {
  if (!serviceId) return null;
  const value = branchMinPrices[serviceId];
  return isValidBookingPrice(value) ? value : null;
}
