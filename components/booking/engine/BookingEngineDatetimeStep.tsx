import React, { useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import type { ActionSheetRef } from 'react-native-actions-sheet';

import type { BookingEngineFlow } from '@/hooks/useBookingEngineFlow';
import AppButton from '@/components/AppButton';
import HomeTodayTeamWaitlistSheet, {
  type HomeTodayTeamWaitlistSheetHandle,
} from '@/components/home/HomeTodayTeamWaitlistSheet';
import Icon from '@/components/Icon';
import { OperatorSupportSheet } from '@/components/OperatorSupportSheet';
import SlotTimePill from '@/components/SlotTimePill';
import ThemedText from '@/components/ThemedText';
import type { BookingFlatSlot } from '@/lib/booking/booking-api/types';
import { ANY_EMPLOYEE_ID } from '@/lib/booking/constants';
import { resolveBranchName } from '@/lib/booking/designShared';
import {
  formatBookingCalendarLongDate,
  formatNextSlotDisplayTime,
  isBookingSlotSelected,
} from '@/utils/reservationCreateHelpers';

interface Props {
  flow: BookingEngineFlow;
}

function interpolate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template
  );
}

function slotHour(start: string): number {
  const h = parseInt(start.split(':')[0] ?? '0', 10);
  return Number.isFinite(h) ? h : 0;
}

function groupSlotsByDayPart(slots: BookingFlatSlot[]) {
  const morning = slots.filter((s) => slotHour(s.start) < 12);
  const afternoon = slots.filter((s) => slotHour(s.start) >= 12);
  return { morning, afternoon };
}

function SlotGroup({
  title,
  slots,
  flow,
}: {
  title: string;
  slots: Array<BookingFlatSlot & { branchId?: string }>;
  flow: BookingEngineFlow;
}) {
  if (slots.length === 0) return null;

  return (
    <View className="mt-4 gap-2">
      <ThemedText className="text-sm font-semibold text-light-subtext dark:text-dark-subtext">
        {title}
      </ThemedText>
      <View className="flex-row flex-wrap items-start self-start">
        {slots.map((slot, index) => {
          const branchName = slot.branchId
            ? resolveBranchName(slot.branchId, flow.branches, flow.profileBranches)
            : undefined;
          const isSelected = isBookingSlotSelected(flow.selectedSlot, slot);
          const multiBranchLabel =
            flow.multiBranchLegend && branchName
              ? `${formatNextSlotDisplayTime(slot.start)} · ${branchName}`
              : undefined;

          return (
            <SlotTimePill
              key={`${slot.start}-${slot.end}-${slot.branchId ?? 'any'}-${slot.employeeId ?? 'any'}-${index}`}
              time={multiBranchLabel ? undefined : slot.start}
              title={multiBranchLabel}
              selected={isSelected}
              spaced
              onPress={() =>
                flow.selectSlot({
                  start: slot.start,
                  end: slot.end,
                  branchId: slot.branchId,
                  branchName,
                  employeeId: slot.employeeId,
                })
              }
            />
          );
        })}
      </View>
    </View>
  );
}

function CalendarDayPill({
  day,
  selected,
  onPress,
}: {
  day: { value: string; label: string; available: boolean; isToday: boolean };
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <View className="items-center" style={{ marginRight: 6, marginBottom: 6 }}>
      <SlotTimePill
        title={day.label}
        selected={selected}
        muted={!day.available}
        onPress={onPress}
      />
      <View
        className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
          day.isToday ? 'bg-light-text dark:bg-dark-text' : 'bg-transparent'
        }`}
      />
    </View>
  );
}

export default function BookingEngineDatetimeStep({ flow }: Props) {
  const { t } = flow;
  const operatorSheetRef = useRef<ActionSheetRef>(null);
  const waitlistSheetRef = useRef<HomeTodayTeamWaitlistSheetHandle>(null);

  const { morning, afternoon } = useMemo(
    () => groupSlotsByDayPart(flow.slotsForSelectedDate),
    [flow.slotsForSelectedDate]
  );

  const selectedDateLabel = useMemo(() => {
    if (!flow.selectedDate) return '';
    return formatBookingCalendarLongDate(flow.selectedDate, flow.dateLocaleTag);
  }, [flow.selectedDate, flow.dateLocaleTag]);

  const showNoSlotsState = flow.selectedDateHasNoSlots;

  const activeEmployee = flow.profileEmployee ?? flow.selectedEmployee;
  const employeeName = activeEmployee?.displayName ?? activeEmployee?.name ?? null;
  const showWaitlist =
    showNoSlotsState &&
    Boolean(activeEmployee?.id) &&
    activeEmployee?.id !== ANY_EMPLOYEE_ID;

  return (
    <View>
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable
          disabled={flow.monthOffset === 0}
          onPress={() => flow.setMonthOffset((prev) => Math.max(0, prev - 1))}
          className={`rounded-full p-2 ${flow.monthOffset === 0 ? 'opacity-40' : 'opacity-100'}`}>
          <Icon name="ChevronLeft" size={24} />
        </Pressable>
        <ThemedText className="text-base font-semibold">{flow.monthLabel}</ThemedText>
        <Pressable onPress={() => flow.setMonthOffset((prev) => prev + 1)} className="rounded-full p-2">
          <Icon name="ChevronRight" size={24} />
        </Pressable>
      </View>

      {flow.loadingCalendar ? <ActivityIndicator size="small" className="py-4" /> : null}

      <View className="flex-row flex-wrap items-start self-start">
        {flow.monthCalendarDays.map((day) => (
          <CalendarDayPill
            key={day.value}
            day={day}
            selected={flow.selectedDate === day.value}
            onPress={() => flow.selectDate(day.value)}
          />
        ))}
      </View>

      {!flow.loadingCalendar && flow.monthCalendarDays.length === 0 ? (
        <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
          {t('reservationNoSlotsMonth')}
        </ThemedText>
      ) : null}

      {flow.selectedDate ? (
        <>
          <View className="mb-2 mt-6">
            <ThemedText className="text-lg font-semibold">{t('reservationAvailableTimes')}</ThemedText>
          </View>

          {showNoSlotsState ? (
            <View className="gap-4">
              <ThemedText className="text-lg font-semibold">
                {interpolate(t('bookingDatetimeEmptyDayTitle'), { day: selectedDateLabel })}
              </ThemedText>
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {employeeName
                  ? interpolate(t('bookingDatetimeEmptyDayBodyNamed'), { employee: employeeName })
                  : t('bookingDatetimeEmptyDayBodyGeneric')}
              </ThemedText>

              {flow.nearestAvailableDateLabel ? (
                <AppButton
                  title={interpolate(t('bookingDatetimeGoToDay'), {
                    day: flow.nearestAvailableDateLabel,
                  })}
                  variant="outline"
                  size="sm"
                  rounded="full"
                  className="self-start"
                  onPress={flow.jumpToNearestAvailableDate}
                />
              ) : null}

              <View className="gap-2 border-t border-light-secondary pt-4 dark:border-dark-secondary">
                <ThemedText className="text-base font-semibold">
                  {t('bookingDatetimeNoTimeSection')}
                </ThemedText>
                <AppButton
                  title={t('bookingDatetimeContactOperator')}
                  variant="outline"
                  size="sm"
                  rounded="full"
                  className="self-start"
                  onPress={() => operatorSheetRef.current?.show()}
                />
                {showWaitlist && activeEmployee ? (
                  <AppButton
                    title={t('bookingWaitlist')}
                    variant="outline"
                    size="sm"
                    rounded="full"
                    className="self-start"
                    onPress={() =>
                      waitlistSheetRef.current?.open({
                        employeeId: activeEmployee.id,
                        employeeName: employeeName ?? activeEmployee.id,
                        branchLabel: flow.selectedBranch?.name ?? flow.selectedBranch?.displayName,
                        dayIso: flow.selectedDate ?? undefined,
                      })
                    }
                  />
                ) : null}
              </View>
            </View>
          ) : (
            <>
              <SlotGroup title={t('reservationMorning')} slots={morning} flow={flow} />
              <SlotGroup title={t('reservationAfternoon')} slots={afternoon} flow={flow} />
            </>
          )}
        </>
      ) : null}

      <OperatorSupportSheet ref={operatorSheetRef} variant="callUs" />
      <HomeTodayTeamWaitlistSheet ref={waitlistSheetRef} t={t} onJoined={() => {}} />
    </View>
  );
}
