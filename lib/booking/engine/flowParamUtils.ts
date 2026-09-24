export function trimSearchParam(value: string | string[] | undefined | null): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export function bookingIdsEqual(a?: string | null, b?: string | null): boolean {
  const left = a?.trim().toLowerCase();
  const right = b?.trim().toLowerCase();
  return Boolean(left && right && left === right);
}
