function parseVersionParts(version: string): [number, number, number] {
  const parts = version.trim().split('.').map((part) => parseInt(part, 10));
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

/** Returns negative when `left` is older than `right`. */
export function compareAppVersions(left: string, right: string): number {
  const [aMajor, aMinor, aPatch] = parseVersionParts(left);
  const [bMajor, bMinor, bPatch] = parseVersionParts(right);

  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
}

export function isAppVersionAtLeast(current: string, minimum: string): boolean {
  return compareAppVersions(current, minimum) >= 0;
}
