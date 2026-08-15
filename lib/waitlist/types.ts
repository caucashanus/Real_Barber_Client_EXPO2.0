export type TeamMemberWaitlistSource = 'app';

export type WaitlistPreferredContact = import('./preferredContact').WaitlistPreferredContact;

export type TeamMemberWaitlistPayload = {
  phone: string;
  employeeId: string;
  employeeName: string;
  branchLabel?: string | null;
  dayIso?: string | null;
  source: TeamMemberWaitlistSource;
  isLoggedIn: true;
  preferredContact: WaitlistPreferredContact;
  clientName?: string | null;
  clientEmail?: string | null;
};

export type PostTeamMemberWaitlistParams = {
  phone: string;
  employeeId: string;
  employeeName: string;
  branchLabel?: string | null;
  dayIso?: string | null;
  preferredContact?: WaitlistPreferredContact;
  clientName?: string | null;
  clientEmail?: string | null;
};

export type PostTeamMemberWaitlistResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  telegramStatus?: number;
};
