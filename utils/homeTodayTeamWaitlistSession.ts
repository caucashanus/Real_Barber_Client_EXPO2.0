const joinedEmployeeIds = new Set<string>();

export function isHomeTodayWaitlistJoined(employeeId: string): boolean {
  return joinedEmployeeIds.has(employeeId);
}

export function markHomeTodayWaitlistJoined(employeeId: string): void {
  joinedEmployeeIds.add(employeeId);
}

export function clearHomeTodayWaitlistSession(): void {
  joinedEmployeeIds.clear();
}
