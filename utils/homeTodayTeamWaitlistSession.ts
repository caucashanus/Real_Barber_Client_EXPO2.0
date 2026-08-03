import { teamMemberWaitlistSessionKey } from '@/utils/teamMemberWaitlist';

const joinedKeys = new Set<string>();

export function isHomeTodayWaitlistJoined(
  employeeId: string,
  dayIso?: string | null
): boolean {
  return joinedKeys.has(teamMemberWaitlistSessionKey(employeeId, dayIso));
}

export function markHomeTodayWaitlistJoined(
  employeeId: string,
  dayIso?: string | null
): void {
  joinedKeys.add(teamMemberWaitlistSessionKey(employeeId, dayIso));
}

export function clearHomeTodayWaitlistSession(): void {
  joinedKeys.clear();
}
