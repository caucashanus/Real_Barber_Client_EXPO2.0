import React, { useRef } from 'react';
import { Pressable, View } from 'react-native';

import type { BookingEngineFlow } from '@/app/hooks/useBookingEngineFlow';
import { useTheme } from '@/app/contexts/ThemeContext';
import RatingBadge from '@/components/RatingBadge';
import ThemedText from '@/components/ThemedText';
import BookingPanelPickerRow from '@/components/booking/engine/BookingPanelPickerRow';
import EmployeeBookingProfileSheet, {
  type EmployeeBookingProfileSheetHandle,
} from '@/components/booking/engine/EmployeeBookingProfileSheet';
import { ANY_EMPLOYEE_ID, type BookingEntity } from '@/lib/booking/constants';
import { formatBookingEmployeeNearestLine } from '@/lib/booking/designShared';

interface Props {
  flow: BookingEngineFlow;
}

function EmployeeCardContent({
  name,
  rating,
  locale,
  meta,
  viewProfileLabel,
  onViewProfile,
}: {
  name: string;
  rating?: number;
  locale: 'cs' | 'en';
  meta: React.ReactNode;
  viewProfileLabel: string;
  onViewProfile: () => void;
}) {
  return (
    <View className="w-full gap-1">
      <View className="flex-row flex-wrap items-center">
        <ThemedText className="mr-2 text-base font-semibold" numberOfLines={1}>
          {name}
        </ThemedText>
        {rating != null ? <RatingBadge rating={rating} locale={locale} /> : null}
      </View>
      {meta}
      <Pressable onPress={onViewProfile} className="self-start active:opacity-70">
        <ThemedText className="font-semibold text-black dark:text-white">{viewProfileLabel}</ThemedText>
      </Pressable>
    </View>
  );
}

export default function BookingEngineEmployeeStep({ flow }: Props) {
  const { t } = flow;
  const { isDark } = useTheme();
  const locale = flow.dateLocaleTag.startsWith('cs') ? 'cs' : 'en';
  const anyEmployeeLogo = isDark
    ? require('@/assets/img/wallet/realbarber-dark.png')
    : require('@/assets/img/wallet/realbarber-light.png');
  const profileSheetRef = useRef<EmployeeBookingProfileSheetHandle>(null);

  const openProfile = (employee: BookingEntity) => {
    profileSheetRef.current?.open({
      employee,
      serviceId: flow.selectedService?.id,
    });
  };

  return (
    <View>
      {flow.loading ? (
        <ThemedText className="py-6 text-center text-sm text-light-subtext dark:text-dark-subtext">
          {t('commonLoading')}
        </ThemedText>
      ) : null}

      {flow.employeesForPicker.map((emp) => {
        const isAny = emp.id === ANY_EMPLOYEE_ID;
        const nearest = flow.employeeNearestSlot[emp.id];
        const loadingNearest = nearest === undefined && !isAny;
        const noSlots = !isAny && nearest === null;
        const disabled = noSlots;

        const meta = isAny ? (
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
            {t('bookingAnyEmployeeMeta')}
          </ThemedText>
        ) : loadingNearest ? (
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
            {t('reservationEmployeeNearestLoading')}
          </ThemedText>
        ) : nearest ? (
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
            {formatBookingEmployeeNearestLine(
              nearest.date.slice(0, 10),
              nearest.start,
              t('bookingEmployeeNearest'),
              locale
            )}
          </ThemedText>
        ) : (
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
            {t('bookingEmployeeNoSlots')}
          </ThemedText>
        );

        const name = emp.displayName ?? emp.name ?? emp.id;
        const rating = (emp.stats as { averageRating?: number } | undefined)?.averageRating;

        return (
          <BookingPanelPickerRow
            key={emp.id}
            imageUrl={isAny ? null : emp.avatarUrl}
            imageSource={isAny ? anyEmployeeLogo : undefined}
            imageFit={isAny ? 'contain' : 'cover'}
            imageShape={isAny ? 'square' : 'round'}
            avatarSize={isAny ? 'md' : 'xl'}
            fallbackName={name}
            title={
              isAny ? (
                <View className="w-full gap-1">
                  <ThemedText className="text-base font-semibold">{name}</ThemedText>
                  {meta}
                </View>
              ) : (
                <EmployeeCardContent
                  name={name}
                  rating={rating}
                  locale={locale}
                  meta={meta}
                  viewProfileLabel={t('bookingEmployeeViewProfile')}
                  onViewProfile={() => openProfile(emp)}
                />
              )
            }
            selected={flow.selectedEmployee?.id === emp.id}
            selectLabel={t('bookingEmployeeSelect')}
            onSelect={() => flow.selectEmployee(emp)}
            actionDisabled={disabled}
          />
        );
      })}

      <EmployeeBookingProfileSheet
        ref={profileSheetRef}
        locale={locale}
        selectLabel={t('bookingEmployeeSelect')}
        onSelect={flow.selectEmployee}
        t={t}
      />
    </View>
  );
}
