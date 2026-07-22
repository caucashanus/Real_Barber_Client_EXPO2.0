export const ANY_EMPLOYEE_ID = 'any';

export const BOOKING_ANY_EMPLOYEE_SEGMENT = 'kdokoliv';

export type BookingEntity = {
  id: string;
  name?: string;
  nameEn?: string | null;
  nameUk?: string | null;
  displayName?: string;
  slug?: string;
  address?: string;
  avatarUrl?: string | null;
  imageUrl?: string | null;
  webUrl?: string | null;
  branches?: { id: string; name?: string; address?: string; imageUrl?: string | null }[];
  items?: unknown[];
  services?: unknown[];
  stats?: { averageRating?: number };
  [key: string]: unknown;
};

export type BookingService = BookingEntity & {
  category?: { id: string; name: string };
  pricing?: { minPrice?: number; maxPrice?: number };
  duration?: number;
};

export type BookingSlot = {
  start: string;
  end: string;
  employeeId?: string;
  branchId?: string;
  branchName?: string;
};
