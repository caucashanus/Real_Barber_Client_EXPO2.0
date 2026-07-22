import type { BookingService } from '@/lib/booking/constants';

export type ServicesByCategory = {
  categoryId: string;
  categoryName: string;
  services: BookingService[];
  collapsible?: boolean;
};
