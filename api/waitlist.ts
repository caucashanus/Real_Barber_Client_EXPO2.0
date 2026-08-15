import { postTeamMemberWaitlist } from '@/lib/waitlist/postTeamMemberWaitlist';
import type { WaitlistPreferredContact } from '@/lib/waitlist/preferredContact';
import type { PostTeamMemberWaitlistResult } from '@/lib/waitlist/types';

export interface JoinEmployeeWaitlistParams {
  phone: string;
  employeeId: string;
  employeeName: string;
  branchLabel?: string | null;
  dayIso?: string;
  preferredContact?: WaitlistPreferredContact;
  clientName?: string | null;
  clientEmail?: string | null;
}

/** POST {WEB_ORIGIN}/api/team-member-waitlist — Telegram formátuje web. */
export async function joinEmployeeWaitlist(
  params: JoinEmployeeWaitlistParams
): Promise<PostTeamMemberWaitlistResult> {
  return postTeamMemberWaitlist({
    phone: params.phone,
    employeeId: params.employeeId,
    employeeName: params.employeeName,
    branchLabel: params.branchLabel,
    dayIso: params.dayIso,
    preferredContact: params.preferredContact,
    clientName: params.clientName,
    clientEmail: params.clientEmail,
  });
}
