import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import ThemedText from '@/components/ThemedText';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { buildVisitPlanDayHighlights } from '@/utils/visitPlanCalendarHighlights';
import {
  VISIT_PLAN_CONFIRMED_DAY_STYLE,
  VISIT_PLAN_IDEAL_CENTER_DAY_STYLE,
  VISIT_PLAN_IDEAL_NEIGHBOR_DAY_STYLE,
} from '@/utils/visitPlanCalendarDayStyles';
import {
  addDays,
  normalizeIsoDateString,
  parseIsoDateLocal,
  startOfMonthIso,
  visitPlanIntlLocaleTag,
} from '@/utils/visitPlanDates';

/** `basis-0` — řádek dnů se roztáhne na celou šířku karty (RN flex). */
const WEEK_COL = 'min-w-0 flex-1 basis-0 items-center';
const DAY_CELL_PX = 36;
const BOOKING_DAY_CELL_PX = 40;

function mondayOfWeekContaining(iso: string): string {
  const d = parseIsoDateLocal(iso);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  return addDays(iso, offset);
}

function formatWeekdayShort(label: string): string {
  return label.replace(/\.$/, '').trim();
}

function dayCellStyles(input: {
  isUpcomingBooking: boolean;
  inIdealWindow: boolean;
  isIdealCenter: boolean;
  isToday: boolean;
  isPast: boolean;
}): { cellClass: string; textClass: string; cellStyle?: ViewStyle } {
  if (input.isUpcomingBooking) {
    return {
      cellClass: '',
      cellStyle: VISIT_PLAN_CONFIRMED_DAY_STYLE,
      textClass: 'font-bold text-green-400',
    };
  }
  if (input.inIdealWindow && input.isIdealCenter) {
    return {
      cellClass: '',
      cellStyle: VISIT_PLAN_IDEAL_CENTER_DAY_STYLE,
      textClass: 'font-bold text-white',
    };
  }
  if (input.inIdealWindow) {
    return {
      cellClass: '',
      cellStyle: VISIT_PLAN_IDEAL_NEIGHBOR_DAY_STYLE,
      textClass: 'font-semibold',
    };
  }
  if (input.isPast) {
    return { cellClass: '', textClass: 'font-normal text-light-subtext dark:text-dark-subtext' };
  }
  if (input.isToday) {
    return {
      cellClass: 'bg-black/10 dark:bg-white/10',
      textClass: 'font-semibold',
    };
  }
  return { cellClass: '', textClass: 'font-medium' };
}

type Props = {
  todayIso: string;
  idealVisitCenterIso: string;
  calendarIdealCenterIso: string;
  intervalDays: number;
  upcomingBookingDate?: string | null;
  firstVisitMode?: boolean;
  onDayPress?: (dateIso: string) => void;
};

export default function VisitPlanVisitCalendarStrip({
  todayIso,
  idealVisitCenterIso,
  calendarIdealCenterIso,
  intervalDays,
  upcomingBookingDate = null,
  firstVisitMode = false,
  onDayPress,
}: Props) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const intlTag = visitPlanIntlLocaleTag(locale);
  const confirmedBookingIso = normalizeIsoDateString(upcomingBookingDate);

  const dayHighlights = useMemo(
    () =>
      buildVisitPlanDayHighlights({
        idealVisitCenterIso,
        confirmedBookingDate: confirmedBookingIso,
        intervalDays,
        suppressIdealHighlight: firstVisitMode,
      }),
    [idealVisitCenterIso, confirmedBookingIso, intervalDays, firstVisitMode]
  );

  const anchorIso =
    confirmedBookingIso ?? (firstVisitMode ? todayIso : calendarIdealCenterIso);
  const [weekStartIso, setWeekStartIso] = useState(() => mondayOfWeekContaining(anchorIso));

  useEffect(() => {
    setWeekStartIso(mondayOfWeekContaining(anchorIso));
  }, [anchorIso]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const iso = addDays(weekStartIso, i);
      const d = parseIsoDateLocal(iso);
      const weekday = d.toLocaleDateString(intlTag, { weekday: 'short' });
      return { iso, dayNum: d.getDate(), weekday: formatWeekdayShort(weekday) };
    });
  }, [weekStartIso, intlTag]);

  const monthLabel = useMemo(() => {
    const mid = parseIsoDateLocal(weekDays[3]?.iso ?? weekStartIso);
    return mid.toLocaleDateString(intlTag, { month: 'long', year: 'numeric' });
  }, [weekDays, weekStartIso, intlTag]);

  const currentMonthStartIso = startOfMonthIso(todayIso);
  const prevWeekStartIso = addDays(weekStartIso, -7);
  const canGoPrevWeek = prevWeekStartIso >= currentMonthStartIso;

  return (
    <View className="self-stretch">
      <View className="mb-2 flex-row items-center justify-between gap-2">
        <ThemedText className="min-w-0 flex-1 text-sm font-semibold capitalize">{monthLabel}</ThemedText>
        <View className="w-[88px] shrink-0 flex-row items-center justify-between">
          <Pressable
            onPress={() => canGoPrevWeek && setWeekStartIso(prevWeekStartIso)}
            disabled={!canGoPrevWeek}
            accessibilityRole="button"
            accessibilityLabel={t('visitPlanCalendarPrevWeek')}
            hitSlop={8}
            className={`h-8 w-8 items-center justify-center active:opacity-70 ${canGoPrevWeek ? '' : 'opacity-40'}`}>
            <ThemedText className="text-xl leading-none text-light-subtext dark:text-dark-subtext">
              ‹
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setWeekStartIso(addDays(weekStartIso, 7))}
            accessibilityRole="button"
            accessibilityLabel={t('visitPlanCalendarNextWeek')}
            hitSlop={8}
            className="h-8 w-8 items-center justify-center active:opacity-70">
            <ThemedText className="text-xl leading-none text-light-subtext dark:text-dark-subtext">
              ›
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <View className="self-stretch flex-row gap-1">
        {weekDays.map((day) => (
          <View key={`wd-${day.iso}`} className={`${WEEK_COL} pb-1`}>
            <ThemedText className="text-center text-xs font-medium text-light-subtext dark:text-dark-subtext">
              {day.weekday}
            </ThemedText>
          </View>
        ))}
      </View>

      <View className="self-stretch flex-row gap-1">
        {weekDays.map((day) => {
          const highlight = dayHighlights[day.iso];
          const isUpcomingBooking = highlight === 'confirmedBooking';
          const inIdealWindow = highlight === 'idealVisit';
          const isIdealCenter = inIdealWindow && day.iso === calendarIdealCenterIso;
          const isToday = day.iso === todayIso;
          const isPast = day.iso < todayIso;
          const clickable = Boolean(onDayPress) && !isPast;
          const { cellClass, textClass, cellStyle } = dayCellStyles({
            isUpcomingBooking,
            inIdealWindow,
            isIdealCenter,
            isToday,
            isPast,
          });
          const cellPx =
            isUpcomingBooking || (inIdealWindow && isIdealCenter)
              ? BOOKING_DAY_CELL_PX
              : DAY_CELL_PX;

          return (
            <View key={day.iso} className={`${WEEK_COL} items-center py-0.5`}>
              <Pressable
                disabled={!clickable}
                onPress={() => clickable && onDayPress?.(day.iso)}
                style={{
                  width: cellPx,
                  height: cellPx,
                  minWidth: cellPx,
                  minHeight: cellPx,
                  ...cellStyle,
                }}
                className={`items-center justify-center rounded-xl ${cellClass} ${
                  clickable && !inIdealWindow && !isUpcomingBooking
                    ? 'active:bg-black/5 dark:active:bg-white/5'
                    : ''
                }`}>
                <ThemedText className={`text-sm tabular-nums ${textClass}`}>{day.dayNum}</ThemedText>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
