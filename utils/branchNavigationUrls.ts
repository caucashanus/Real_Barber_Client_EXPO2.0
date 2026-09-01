import { Linking } from 'react-native';

export const BRANCH_NAVIGATE_OPEN_DELAY_MS = 300;

export function getBranchNavigateMapsQuery(
  branchName?: string | null,
  address?: string | null
): string {
  return (address?.trim() || branchName?.trim() || '').trim();
}

export function buildBranchGoogleMapsUrl(
  branchName?: string | null,
  address?: string | null,
  latitude?: number | null,
  longitude?: number | null
): string {
  if (latitude != null && longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }
  const q = encodeURIComponent(getBranchNavigateMapsQuery(branchName, address));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function buildBranchWazeUrl(
  branchName?: string | null,
  address?: string | null,
  latitude?: number | null,
  longitude?: number | null
): string {
  if (latitude != null && longitude != null) {
    return `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
  }
  const q = encodeURIComponent(getBranchNavigateMapsQuery(branchName, address));
  return `https://waze.com/ul?q=${q}&navigate=yes`;
}

function openUrlAfterDelay(url: string, delayMs: number): void {
  setTimeout(() => {
    void Linking.openURL(url).catch(() => {});
  }, delayMs);
}

export function openBranchGoogleMaps(
  branchName?: string | null,
  address?: string | null,
  latitude?: number | null,
  longitude?: number | null,
  delayMs = BRANCH_NAVIGATE_OPEN_DELAY_MS
): void {
  openUrlAfterDelay(buildBranchGoogleMapsUrl(branchName, address, latitude, longitude), delayMs);
}

export function openBranchWaze(
  branchName?: string | null,
  address?: string | null,
  latitude?: number | null,
  longitude?: number | null,
  delayMs = BRANCH_NAVIGATE_OPEN_DELAY_MS
): void {
  openUrlAfterDelay(buildBranchWazeUrl(branchName, address, latitude, longitude), delayMs);
}

export function canOpenBranchNavigation(
  branchName?: string | null,
  address?: string | null,
  latitude?: number | null,
  longitude?: number | null
): boolean {
  if (latitude != null && longitude != null) return true;
  return getBranchNavigateMapsQuery(branchName, address) !== '';
}
