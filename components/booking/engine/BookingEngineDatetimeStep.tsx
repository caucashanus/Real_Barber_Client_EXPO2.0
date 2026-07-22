import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import type { BookingEngineFlow } from '@/app/hooks/useBookingEngineFlow';
import { Chip } from '@/components/Chip';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import BookingMultiBranchCalendarLegend from '@/components/booking/engine/BookingMultiBranchCalendarLegend';
import { getBranchIdsWithSlotsOnDate } from '@/lib/booking/booking-api/mappers';
import type { BookingFlatSlot } from '@/lib/booking/booking-api/types';
import { getBranchThemeColorCss, resolveBranchName } from '@/lib/booking/designShared';

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

function DayChip({
  day,
  selected,
  branchIds,
  branchColorForId,
  selectedFillColor,
  onPress,
}: {
  day: { value: string; label: string };
  selected: boolean;
  branchIds: string[];
  branchColorForId: (id: string) => string;
  selectedFillColor: string;
  onPress: () => void;
}) {
  const singleBranchColor =
    branchIds.length === 1 ? branchColorForId(branchIds[0]!) : undefined;
  const fillColor = selected ? (singleBranchColor ?? selectedFillColor) : undefined;

  return (
    <Pressable
      onPress={onPress}
      className={`min-w-[72px] rounded-xl border px-3 py-2 active:opacity-80 ${
        selected
          ? 'border-transparent'
          : 'border-light-secondary bg-light-secondary dark:border-dark-secondary dark:bg-dark-secondary'
      }`}
      style={
        fillColor
          ? { backgroundColor: fillColor }
          : singleBranchColor
            ? { borderLeftWidth: 3, borderLeftColor: singleBranchColor }
            : undefined
      }>
      <ThemedText
        className={`text-center text-sm font-medium ${
          selected ? 'text-white dark:text-white' : ''
        }`}>
        {day.label}
      </ThemedText>
      {branchIds.length > 1 ? (
        <View className="mt-1 flex-row justify-center gap-1">
          {branchIds.map((id) => (
            <View
              key={id}
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: branchColorForId(id) }}
            />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
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
      <View className="flex-row flex-wrap gap-2">
        {slots.map((slot) => {
          const branchName = slot.branchId
            ? resolveBranchName(slot.branchId, flow.branches, flow.profileBranches)
            : undefined;
          const label =
            flow.multiBranchLegend && branchName
              ? `${slot.start} · ${branchName}`
              : slot.start;
          const isSelected =
            flow.selectedSlot?.start === slot.start &&
            (flow.selectedSlot?.branchId ?? '') === (slot.branchId ?? '');

          return (
            <Chip
              key={`${slot.start}-${slot.end}-${slot.branchId ?? ''}`}
              size="lg"
              label={label}
              isSelected={isSelected}
              onPress={() =>
                flow.selectSlot({
                  start: slot.start,
                  end: slot.end,
                  branchId: slot.branchId,
                  branchName,
                })
              }
              style={
                isSelected
                  ? { backgroundColor: flow.branchHighlightColor, borderColor: flow.branchHighlightColor }
                  : undefined
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

  const branchColorForId = useMemo(() => {
    const lookup = new Map<string, string>();
    for (const branch of [...flow.profileBranches, ...flow.branches]) {
      lookup.set(branch.id, getBranchThemeColorCss(branch));
    }
    return (id: string) => lookup.get(id) ?? flow.branchHighlightColor;
  }, [flow.profileBranches, flow.branches, flow.branchHighlightColor]);

  const { morning, afternoon } = useMemo(
    () => groupSlotsByDayPart(flow.slotsForSelectedDate),
    [flow.slotsForSelectedDate]
  );

  return (
    <View>
      <View className="mb-4 flex-row gap-2">
        {flow.showTodayChip ? (
          <Chip
            size="lg"
            label={t('reservationToday')}
            isSelected={flow.selectedDate === flow.todayIso}
            onPress={() => {
              flow.setMonthOffset(0);
              flow.selectDate(flow.todayIso);
            }}
          />
        ) : null}
        {flow.showTomorrowChip ? (
          <Chip
            size="lg"
            label={t('reservationTomorrow')}
            isSelected={flow.selectedDate === flow.tomorrowIso}
            onPress={() => {
              flow.setMonthOffset(0);
              flow.selectDate(flow.tomorrowIso);
            }}
          />
        ) : null}
      </View>

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

      <View className="flex-row flex-wrap gap-2">
        {flow.visibleMonthDays.map((day) => {
          const branchIds = flow.multiBranchLegend
            ? getBranchIdsWithSlotsOnDate(flow.availabilityByBranch, day.value)
            : [];
          return (
            <DayChip
              key={day.value}
              day={day}
              selected={flow.selectedDate === day.value}
              branchIds={branchIds}
              branchColorForId={branchColorForId}
              selectedFillColor={flow.branchHighlightColor}
              onPress={() => flow.selectDate(day.value)}
            />
          );
        })}
      </View>

      {flow.visibleMonthDays.length === 0 && !flow.loadingCalendar ? (
        <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
          {t('reservationNoSlotsMonth')}
        </ThemedText>
      ) : null}

      {flow.multiBranchLegend ? (
        <BookingMultiBranchCalendarLegend branches={flow.profileBranches} />
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
