import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import type { BookingEngineFlow } from '@/app/hooks/useBookingEngineFlow';
import Icon from '@/components/Icon';
import SlotTimePill from '@/components/SlotTimePill';
import ThemedText from '@/components/ThemedText';
import type { BookingFlatSlot } from '@/lib/booking/booking-api/types';
import { resolveBranchName } from '@/lib/booking/designShared';
import { formatNextSlotDisplayTime } from '@/utils/reservationCreateHelpers';

interface Props {
  flow: BookingEngineFlow;
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
        {slots.map((slot) => {
          const branchName = slot.branchId
            ? resolveBranchName(slot.branchId, flow.branches, flow.profileBranches)
            : undefined;
          const isSelected =
            flow.selectedSlot?.start === slot.start &&
            (flow.selectedSlot?.branchId ?? '') === (slot.branchId ?? '');
          const multiBranchLabel =
            flow.multiBranchLegend && branchName
              ? `${formatNextSlotDisplayTime(slot.start)} · ${branchName}`
              : undefined;

          return (
            <SlotTimePill
              key={`${slot.start}-${slot.end}-${slot.branchId ?? ''}`}
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
                })
              }
            />
          );
        })}
      </View>
    </View>
  );
}

export default function BookingEngineDatetimeStep({ flow }: Props) {
  const { t } = flow;

  const { morning, afternoon } = useMemo(
    () => groupSlotsByDayPart(flow.slotsForSelectedDate),
    [flow.slotsForSelectedDate]
  );

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
        {flow.visibleMonthDays.map((day) => (
          <SlotTimePill
            key={day.value}
            title={day.label}
            selected={flow.selectedDate === day.value}
            spaced
            onPress={() => flow.selectDate(day.value)}
          />
        ))}
      </View>

      {flow.visibleMonthDays.length === 0 && !flow.loadingCalendar ? (
        <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
          {t('reservationNoSlotsMonth')}
        </ThemedText>
      ) : null}

      {flow.selectedDate ? (
        <>
          <View className="mb-2 mt-6">
            <ThemedText className="text-lg font-semibold">{t('reservationAvailableTimes')}</ThemedText>
          </View>
          <SlotGroup title={t('reservationMorning')} slots={morning} flow={flow} />
          <SlotGroup title={t('reservationAfternoon')} slots={afternoon} flow={flow} />
          {morning.length === 0 && afternoon.length === 0 && !flow.loadingCalendar ? (
            <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
              {t('reservationNoSlotsSelection')}
            </ThemedText>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
