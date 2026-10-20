import React from 'react';
import { View } from 'react-native';

import HomeRecentBookingsSection from '@/components/home/HomeRecentBookingsSection';
import HomeFastBookListTrigger from '@/components/home/fast-book/HomeFastBookListTrigger';
import {
  HomeFastBookServicesSheet,
  HomeFastBookWhenSheet,
} from '@/components/home/fast-book/HomeFastBookSheets';
import type { Booking } from '@/api/bookings';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHomeFastBookFlow } from '@/hooks/useHomeFastBookFlow';
import { useTranslation } from '@/hooks/useTranslation';

type Props = {
  bookings?: Booking[] | null;
  bookingsLoading?: boolean;
};

export default function HomeFastBookStrip({ bookings, bookingsLoading }: Props) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const flow = useHomeFastBookFlow();

  return (
    <View className="w-full">
      <HomeFastBookListTrigger
        listLabel={t('fastBookHomeListLabel')}
        laterLabel={t('fastBookLater')}
        whenOpenFromList={flow.whenOpenFromList}
        onOpenServices={flow.openServices}
        onOpenLater={flow.openWhenFromList}
      />
      <HomeRecentBookingsSection
        integrated
        bookings={bookings}
        loading={bookingsLoading}
      />
      <HomeFastBookWhenSheet flow={flow} t={t} />
      <HomeFastBookServicesSheet
        flow={flow}
        locale={locale}
        bookings={bookings}
        bookingsLoading={bookingsLoading}
        t={t}
      />
    </View>
  );
}
