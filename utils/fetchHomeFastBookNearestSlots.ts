import { fetchPublicServicePage } from '@/api/publicServicePage';
import type { HomeFastBookService } from '@/constants/homeFastBookServices';
import type { Locale } from '@/contexts/LanguageContext';
import { SERVICE_PAGE_DAYS } from '@/constants/servicePage';
import { mapPublicServiceNearestSlots } from '@/utils/mapPublicServiceNearestSlots';
import type { NearestBranchHomeSlot } from '@/utils/nearestBranchHomeSlots';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

export type HomeFastBookLoadedSlots = {
  serviceId: string;
  serviceName: string;
  serviceSlug: string;
  slots: NearestBranchHomeSlot[];
};

export async function fetchHomeFastBookNearestSlots(
  service: HomeFastBookService,
  locale: Locale
): Promise<HomeFastBookLoadedSlots> {
  const catalog = await fetchPublicServicePage(service.crmId, {
    date: getPragueTodayDateString(),
    days: SERVICE_PAGE_DAYS,
    bustCache: true,
  });

  if (!catalog) {
    throw new Error('service page empty');
  }

  const serviceId = catalog.id?.trim() || service.crmId;
  const serviceName = catalog.name?.trim() || service.identitySlug;
  const slots = mapPublicServiceNearestSlots(catalog.nearestSlots, locale);

  return {
    serviceId,
    serviceName,
    serviceSlug: service.identitySlug,
    slots,
  };
}
