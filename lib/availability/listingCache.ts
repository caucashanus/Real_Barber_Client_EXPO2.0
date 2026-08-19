/** Parita s web ISR (~1 h) pro public listing dostupnosti (sloty + směny). */
export const LISTING_TTL_MS = 60 * 60 * 1000;

const bustPrefixes: string[] = [];

function isListingBusted(cacheKey: string): boolean {
  return bustPrefixes.some((prefix) => cacheKey === prefix || cacheKey.startsWith(prefix));
}

export function shouldRefetchListing(
  cacheKey: string,
  fetchedAt: number,
  options?: { force?: boolean }
): boolean {
  if (options?.force) return true;
  if (fetchedAt === 0) return true;
  if (isListingBusted(cacheKey)) return true;
  return Date.now() - fetchedAt >= LISTING_TTL_MS;
}

export function ackListingFetch(cacheKey: string): void {
  for (let i = bustPrefixes.length - 1; i >= 0; i--) {
    const prefix = bustPrefixes[i]!;
    if (cacheKey === prefix || cacheKey.startsWith(prefix)) {
      bustPrefixes.splice(i, 1);
    }
  }
}

/** Hard invalidate (ekvivalent web revalidateTag) po vlastní rezervaci / holdu. */
export function invalidateListingAvailability(params?: {
  employeeId?: string | null;
  branchId?: string | null;
  serviceId?: string | null;
}): void {
  bustPrefixes.push('home', 'roster');
  if (params?.employeeId?.trim()) bustPrefixes.push('employee:');
  if (params?.branchId?.trim()) bustPrefixes.push('branch:');
  if (params?.serviceId?.trim()) bustPrefixes.push('service:');
}

/** Foreground resume — tichý refetch listingů (bez web webhooku). */
export function invalidateAllListingsOnResume(): void {
  bustPrefixes.push('home', 'roster', 'employee:', 'branch:', 'service:');
}
