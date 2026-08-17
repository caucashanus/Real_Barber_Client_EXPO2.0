import React, { useRef } from 'react';
import { Pressable, View } from 'react-native';

import type { BookingEngineFlow } from '@/hooks/useBookingEngineFlow';
import { useTheme } from '@/contexts/ThemeContext';
import AppButton from '@/components/AppButton';
import ThemedText from '@/components/ThemedText';
import BookingPanelPickerRow from '@/components/booking/engine/BookingPanelPickerRow';
import EmployeeBookingProfileSheet, {
  type EmployeeBookingProfileSheetHandle,
} from '@/components/booking/engine/EmployeeBookingProfileSheet';
import { ANY_EMPLOYEE_ID, type BookingEntity } from '@/lib/booking/constants';
import {
  formatBookingEmployeeNearestDayLabel,
} from '@/lib/booking/designShared';
import { appLocaleFromIntlTag } from '@/utils/intlLocaleTag';
import { formatNextSlotDisplayTime } from '@/utils/reservationCreateHelpers';

interface Props {
  flow: BookingEngineFlow;
}

function formatPlainRating(rating: number, locale: 'cs' | 'en' | 'uk'): string {
  const value = rating.toFixed(1);
  const formatted = locale === 'en' ? value : value.replace('.', ',');
  return `★ ${formatted}`;
}

function EmployeeCardContent({
  name,
  rating,
  locale,
}: {
  name: string;
  rating?: number;
  locale: 'cs' | 'en' | 'uk';
}) {
  return (
    <View className="w-full">
      <View className="flex-row flex-wrap items-center gap-2">
        <ThemedText className="text-base font-semibold" numberOfLines={1}>
          {name}
        </ThemedText>
        {rating != null ? (
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
            {formatPlainRating(rating, locale)}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

function EmployeeNearestMeta({
  flow,
  emp,
  nearest,
  loadingNearest,
  noSlots,
  locale,
}: {
  flow: BookingEngineFlow;
  emp: BookingEntity;
  nearest?: { date: string; start: string } | null;
  loadingNearest: boolean;
  noSlots: boolean;
  locale: 'cs' | 'en' | 'uk';
}) {
  const { t } = flow;

  if (loadingNearest) {
    return (
      <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
        {t('reservationEmployeeNearestLoading')}
      </ThemedText>
    );
  }

  if (noSlots || !nearest) {
    return (
      <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
        {t('bookingEmployeeNoSlots')}
      </ThemedText>
    );
  }

  const dayLabel = formatBookingEmployeeNearestDayLabel(nearest.date.slice(0, 10), locale);
  const timeLabel = formatNextSlotDisplayTime(nearest.start);
  const chipLabel = dayLabel && timeLabel ? `${dayLabel} · ${timeLabel}` : dayLabel || timeLabel;
  const chipSelected =
    flow.selectedEmployee?.id === emp.id && flow.employeeNearestChipEmployeeId === emp.id;

  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
        {t('bookingEmployeeNearest')}
      </ThemedText>
      <AppButton
        variant="choice"
        size="xs"
        title={chipLabel}
        selected={chipSelected}
        onPress={() => flow.selectEmployeeNearestChip(emp, nearest)}
        disableHaptic
        className="h-[22px] min-h-[22px] justify-center rounded-md px-2 py-0"
        textClassName="text-xs font-semibold leading-none tabular-nums"
        style={{ justifyContent: 'center', alignItems: 'center' }}
      />
    </View>
  );
}

export default function BookingEngineEmployeeStep({ flow }: Props) {
  const { t } = flow;
  const { isDark } = useTheme();
  const locale = appLocaleFromIntlTag(flow.dateLocaleTag);
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
      {flow.employeesLoading ? (
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
        ) : (
          <View className="gap-1">
            <EmployeeNearestMeta
              flow={flow}
              emp={emp}
              nearest={nearest}
              loadingNearest={loadingNearest}
              noSlots={noSlots}
              locale={locale}
            />
            <Pressable onPress={() => openProfile(emp)} className="self-start active:opacity-70">
              <ThemedText className="font-semibold text-black dark:text-white">
                {t('bookingEmployeeViewProfile')}
              </ThemedText>
            </Pressable>
          </View>
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
                <ThemedText className="text-base font-semibold">{name}</ThemedText>
              ) : (
                <EmployeeCardContent name={name} rating={rating} locale={locale} />
              )
            }
            meta={meta}
            selected={flow.selectedEmployee?.id === emp.id}
            disabled={disabled}
            onPress={() => flow.selectEmployee(emp)}
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
