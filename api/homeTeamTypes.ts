export interface HomepageTodayTeamBranch {
  id: string;
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
  address?: string | null;
}

export interface HomepageWorkInterval {
  startTime: string;
  endTime: string;
  branchId: string;
}

export interface HomepageTodayTeamMember {
  id: string;
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
  avatarUrl?: string | null;
  webUrl?: string | null;
  branches?: HomepageTodayTeamBranch[];
  workIntervals?: HomepageWorkInterval[];
}

export interface HomepageNextSlot {
  date: string;
  time: string;
  endTime?: string;
  duration?: number;
  branchId: string;
}

export interface HomepageEmployeeAvailability {
  employeeId: string;
  nextSlots?: HomepageNextSlot[];
}
