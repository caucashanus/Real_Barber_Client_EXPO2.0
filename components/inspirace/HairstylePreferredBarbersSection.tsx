import React, { useMemo } from 'react';

import HairstylePortraitCarouselSection, {
  type HairstylePortraitCarouselItem,
} from '@/components/inspirace/HairstylePortraitCarouselSection';
import { barberDetailHref } from '@/constants/profileDetailRoutes';
import type { BranchEmployee } from '@/api/branches';
import type { TranslationKey } from '@/locales';

interface HairstylePreferredBarbersSectionProps {
  employees: BranchEmployee[];
  t: (key: TranslationKey) => string;
}

export default function HairstylePreferredBarbersSection({
  employees,
  t,
}: HairstylePreferredBarbersSectionProps) {
  const items = useMemo<HairstylePortraitCarouselItem[]>(
    () =>
      employees.map((employee) => ({
        id: employee.id,
        title: employee.name,
        image: employee.avatarUrl?.trim()
          ? employee.avatarUrl
          : require('@/assets/img/barbers.png'),
        href: barberDetailHref(employee.id),
        entityType: 'employee',
        entityId: employee.id,
      })),
    [employees]
  );

  return (
    <HairstylePortraitCarouselSection
      title={t('inspiraceDetailPreferredBarbers')}
      items={items}
    />
  );
}
