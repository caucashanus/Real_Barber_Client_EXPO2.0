import type { BookingEntity, BookingService } from '@/lib/booking/constants';

export type BookingFlatSlot = {
  start: string;
  end: string;
  durationMinutes?: number;
  employeeId?: string;
  branchId?: string;
};

export type BookingFlatDayAvailability = {
  closed?: boolean;
  slots?: BookingFlatSlot[];
};

export type BookingFlatAvailabilityMap = Record<string, BookingFlatDayAvailability>;

export type BookingBootstrapResponse = {
  branches: BookingEntity[];
  meta: {
    defaultBranchSlug?: string | null;
    servicesCategoryId?: string;
    timezone?: string;
  };
};

export type BookingCatalogItem = {
  id: string;
  slug?: string;
  name?: string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  priceFrom?: number;
  price?: number;
  durationMinutes?: number | null;
  webUrl?: string | null;
  category?: { id?: string; name: string };
  employeeIds?: string[];
};

export type BookingBranchCatalogResponse = {
  branch: BookingEntity;
  items: BookingCatalogItem[];
};

export type BookingEmployeePickerEmployee = {
  id: string;
  slug?: string;
  name?: string;
  displayName?: string;
  avatarUrl?: string | null;
  averageRating?: number;
  reviewCount?: number;
  price?: number;
  durationMinutes?: number;
  nearestSlot?: {
    date: string;
    start: string;
    end?: string;
    branchId?: string;
  } | null;
};

export type BookingEmployeePickerResponse = {
  branch: BookingEntity;
  item: BookingCatalogItem;
  fromDate?: string;
  maxDays?: number;
  anyEmployeeAllowed?: boolean;
  employees: BookingEmployeePickerEmployee[];
};

export type BookingCalendarResponse = {
  branchId: string;
  itemId: string;
  employeeId: string;
  from: string;
  days: number;
  availability: BookingFlatAvailabilityMap;
};

export type BookingCalendarMultiBranchResponse = {
  employeeId: string;
  itemId: string;
  from: string;
  days: number;
  branches: {
    id: string;
    slug?: string;
    name?: string;
    address?: string;
    availability: BookingFlatAvailabilityMap;
  }[];
};

export type BookingEmployeeProfileResponse = {
  employee: BookingEntity & {
    items?: BookingCatalogItem[];
    services?: BookingCatalogItem[];
  };
};

export type BookingServiceContextResponse = {
  item: BookingCatalogItem & { description?: string | null };
  branches: (BookingEntity & { priceFrom?: number })[];
};

export type BookingSlotServiceNextAvailable = {
  date: string;
  slotStart: string;
  slotEnd: string;
  branchId: string;
};

export type BookingSlotServiceItem = {
  id: string;
  slug?: string;
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
  imageUrl?: string | null;
  webUrl?: string | null;
  durationMinutes: number;
  price: number;
  available: boolean;
  nextAvailable: BookingSlotServiceNextAvailable | null;
};

export type BookingSlotServicesResponse = {
  employeeId: string;
  branchId: string;
  date: string;
  slotStart: string;
  slotEnd?: string | null;
  categoryId: string;
  services: BookingSlotServiceItem[];
  meta: {
    generatedAt: string;
    timezone: string;
  };
};

export type BookingOtpRequestResult = {
  requiresOtpVerification: boolean;
  challengeSent?: boolean;
  challengeToken?: string | null;
  expiresInSeconds?: number;
};

export type BookingCreateReservationResponse = {
  id?: string;
  booking?: { id?: string };
  reservation?: { id?: string };
};
