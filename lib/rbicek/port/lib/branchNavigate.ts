/** Text query pro mapy: nejdřív adresa, fallback název pobočky. */
export function getBranchNavigateMapsQuery(
  branchName?: string | null,
  address?: string | null,
): string {
  const addr = (address ?? '').trim();
  if (addr) return addr;
  return (branchName ?? '').trim();
}

export function googleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function wazeNavigateUrl(query: string): string {
  return `https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`;
}
