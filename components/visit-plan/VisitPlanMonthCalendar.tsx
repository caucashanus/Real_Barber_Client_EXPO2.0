import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import ThemedText from '@/components/ThemedText';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import type { VisitPlanDayHighlight } from '@/utils/visitPlanCalendarHighlights';
import {
  VISIT_PLAN_CONFIRMED_DAY_STYLE,
  VISIT_PLAN_IDEAL_CENTER_DAY_STYLE,
  VISIT_PLAN_IDEAL_NEIGHBOR_DAY_STYLE,
} from '@/utils/visitPlanCalendarDayStyles';
import {
  addDays,
  addMonthsIso,
  daysInCalendarMonth,
  parseIsoDateLocal,
  startOfMonthIso,
  visitPlanIntlLocaleTag,
} from '@/utils/visitPlanDates';

const CELL_PX = 36;
const WEEK_COL = 'min-w-0 flex-1 basis-0 items-center';

function formatWeekdayShort(label: string): string {
  return label.replace(/\.$/, '').trim();
}

type Props = {
  todayIso: string;
  focusDateIso: string;
  idealVisitCenterIso: string;
  dayHighlights: Record<string, VisitPlanDayHighlight>;
  onDayPress?: (dateIso: string) => void;
};

export default function VisitPlanMonthCalendar({
  todayIso,
  focusDateIso,
  idealVisitCenterIso,
  dayHighlights,
  onDayPress,
}: Props) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const intlTag = visitPlanIntlLocaleTag(locale);

  const [displayMonthIso, setDisplayMonthIso] = useState(() => startOfMonthIso(focusDateIso));

  useEffect(() => {
    setDisplayMonthIso(startOfMonthIso(focusDateIso));
  }, [focusDateIso]);

  const currentMonthStartIso = startOfMonthIso(todayIso);
  const canGoPrev = displayMonthIso > currentMonthStartIso;

  const monthLabel = useMemo(() => {
    const d = parseIsoDateLocal(displayMonthIso);
    return d.toLocaleDateString(intlTag, { month: 'long', year: 'numeric' });
  }, [displayMonthIso, intlTag]);

  const weekdayLabels = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = parseIsoDateLocal(addDays('2024-01-07', i));
      return formatWeekdayShort(d.toLocaleDateString(intlTag, { weekday: 'short' }));
    });
  }, [intlTag]);

  const monthStartPad = parseIsoDateLocal(displayMonthIso).getDay();
  const daysInMonth = daysInCalendarMonth(displayMonthIso);
  const totalCells = Math.ceil((monthStartPad + daysInMonth) / 7) * 7;

  return (
    <View>
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => canGoPrev && setDisplayMonthIso(addMonthsIso(displayMonthIso, -1))}
          disabled={!canGoPrev}
          accessibilityRole="button"
          accessibilityLabel={t('visitPlanCalendarPrevMonth')}
          className={`size-11 items-center justify-center active:opacity-70 ${canGoPrev ? '' : 'opacity-40'}`}>
          <ThemedText className="text-3xl leading-none text-light-subtext dark:text-dark-subtext">
            ‹
          </ThemedText>
        </Pressable>
        <ThemedText className="text-base font-semibold capitalize md:text-lg">{monthLabel}</ThemedText>
        <Pressable
          onPress={() => setDisplayMonthIso(addMonthsIso(displayMonthIso, 1))}
          accessibilityRole="button"
          accessibilityLabel={t('visitPlanCalendarNextMonth')}
          className="size-11 items-center justify-center active:opacity-70">
          <ThemedText className="text-3xl leading-none text-light-subtext dark:text-dark-subtext">
            ›
          </ThemedText>
        </Pressable>
      </View>

      <View className="flex-row gap-1">
        {weekdayLabels.map((label) => (
          <View key={label} className={`${WEEK_COL} pb-1`}>
            <ThemedText className="text-center text-xs font-medium text-light-subtext dark:text-dark-subtext">
              {label}
            </ThemedText>
          </View>
        ))}
      </View>

      {Array.from({ length: totalCells / 7 }, (_, rowIndex) => (
        <View key={`row-${rowIndex}`} className="flex-row gap-1">
          {Array.from({ length: 7 }, (_, colIndex) => {
            const cellIndex = rowIndex * 7 + colIndex;
            const dayIndex = cellIndex - monthStartPad;
            if (dayIndex < 0 || dayIndex >= daysInMonth) {
              return (
                <View key={`empty-${cellIndex}`} className={`${WEEK_COL} items-center py-0.5`}>
                  <View style={{ width: CELL_PX, height: CELL_PX }} />
                </View>
              );
            }

            const dateIso = addDays(displayMonthIso, dayIndex);
            const highlight = dayHighlights[dateIso];
            const isPast = dateIso < todayIso;
            const isToday = dateIso === todayIso;
            const isConfirmed = highlight === 'confirmedBooking';
            const isIdealCenter = highlight === 'idealVisit' && dateIso === idealVisitCenterIso;
            const isIdealNeighbor = highlight === 'idealVisit' && dateIso !== idealVisitCenterIso;
            const clickable = Boolean(onDayPress) && !isPast;

            let cellStyle: ViewStyle | undefined;
            if (isConfirmed) {
              cellStyle = VISIT_PLAN_CONFIRMED_DAY_STYLE;
            } else if (isIdealCenter) {
              cellStyle = VISIT_PLAN_IDEAL_CENTER_DAY_STYLE;
            } else if (isIdealNeighbor) {
              cellStyle = VISIT_PLAN_IDEAL_NEIGHBOR_DAY_STYLE;
            }

            const textClass = isConfirmed
              ? 'font-bold text-green-400'
              : isIdealCenter
                ? 'font-bold text-white'
                : isIdealNeighbor
                  ? 'font-semibold'
                  : isPast
                    ? 'font-normal text-light-subtext/80 dark:text-dark-subtext/80'
                    : 'font-medium';

            return (
              <View key={dateIso} className={`${WEEK_COL} items-center py-0.5`}>
                <Pressable
                  disabled={!clickable}
                  onPress={() => clickable && onDayPress?.(dateIso)}
                  style={{
                    width: CELL_PX,
                    height: CELL_PX,
                    minWidth: CELL_PX,
                    minHeight: CELL_PX,
                    ...cellStyle,
                  }}
                  className={`relative items-center justify-center rounded-xl ${
                    clickable && !highlight ? 'active:bg-black/5 dark:active:bg-white/5' : ''
                  }`}>
                  <ThemedText className={`text-sm tabular-nums ${textClass}`}>
                    {dayIndex + 1}
                  </ThemedText>
                  {isToday && !isConfirmed ? (
                    <View className="absolute bottom-1.5 size-1 rounded-full bg-black/55 dark:bg-white/55" />
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
