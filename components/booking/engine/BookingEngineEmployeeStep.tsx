import React from 'react';
import { Pressable, View } from 'react-native';

import type { BookingEngineFlow } from '@/app/hooks/useBookingEngineFlow';
import ThemedText from '@/components/ThemedText';
import BookingPanelPickerRow from '@/components/booking/engine/BookingPanelPickerRow';
import { ANY_EMPLOYEE_ID } from '@/lib/booking/constants';
import { formatNearestTermLabel } from '@/lib/booking/designShared';

interface Props {
  flow: BookingEngineFlow;
}

function EmployeeTitleRow({
  name,
  rating,
  aboutLabel,
  showAbout,
  onAbout,
}: {
  name: string;
  rating?: number;
  aboutLabel: string;
  showAbout: boolean;
  onAbout?: () => void;
}) {
  return (
    <View className="gap-0.5">
      <View className="flex-row flex-wrap items-center gap-2">
        <ThemedText className="text-base font-medium" numberOfLines={1}>
          {name}
        </ThemedText>
        {showAbout && onAbout ? (
          <Pressable
            onPress={onAbout}
            className="rounded-full border border-light-border px-2 py-0.5 active:opacity-70 dark:border-dark-border">
            <ThemedText className="text-xs font-medium">{aboutLabel}</ThemedText>
          </Pressable>
        ) : null}
      </View>
      {rating != null ? (
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">★ {rating}</ThemedText>
      ) : null}
    </View>
  );
}

function NearestMeta({
  slot,
  nearestLabel,
  branchColor,
  locale,
}: {
  slot: { date: string; start: string };
  nearestLabel: string;
  branchColor: string;
  locale: 'cs' | 'en';
}) {
  const dateLabel = formatNearestTermLabel(slot.date.slice(0, 10), locale);
  return (
    <View className="mt-1 gap-1">
      <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{nearestLabel}</ThemedText>
      <View className="flex-row flex-wrap gap-1.5">
        <View className="rounded-lg px-2 py-0.5" style={{ backgroundColor: branchColor }}>
          <ThemedText className="text-xs font-medium">{dateLabel}</ThemedText>
        </View>
        <View className="rounded-lg px-2 py-0.5" style={{ backgroundColor: branchColor }}>
          <ThemedText className="text-xs font-medium">{slot.start}</ThemedText>
        </View>
      </View>
    </View>
  );
}

export default function BookingEngineEmployeeStep({ flow }: Props) {
  const { t } = flow;
  const locale = flow.dateLocaleTag.startsWith('cs') ? 'cs' : 'en';

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
          <NearestMeta
            slot={nearest}
            nearestLabel={t('reservationEmployeeNearestFreeSlotLabel')}
            branchColor={flow.branchHighlightColor}
            locale={locale}
          />
        ) : (
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
            {t('reservationEmployeeNoNearestSlot')}
          </ThemedText>
        );

        const name = emp.displayName ?? emp.name ?? emp.id;
        const rating = (emp.stats as { averageRating?: number } | undefined)?.averageRating;

        return (
          <BookingPanelPickerRow
            key={emp.id}
            imageUrl={isAny ? null : emp.avatarUrl}
            imageShape="round"
            fallbackName={isAny ? 'K' : name}
            title={
              isAny ? (
                name
              ) : (
                <EmployeeTitleRow
                  name={name}
                  rating={rating}
                  aboutLabel={t('bookingEmployeeAbout')}
                  showAbout={false}
                />
              )
            }
            meta={meta}
            selected={flow.selectedEmployee?.id === emp.id}
            selectLabel={t('bookingEmployeeSelect')}
            onSelect={() => flow.selectEmployee(emp)}
            actionDisabled={disabled}
            selectedRingColor={flow.branchHighlightColor}
          />
        );
      })}
    </View>
  );
}
