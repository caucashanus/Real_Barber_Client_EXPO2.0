import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

import type { TeamMemberPageBranch, TeamMemberShiftDay } from '@/api/publicTeamMember';
import { Button } from '@/components/Button';
import BranchAddress from '@/components/shared/BranchAddress';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import type { Locale } from '@/contexts/LanguageContext';
import {
  buildBarberBookingHref,
  flattenShiftCalendarRows,
  getUniqueShiftDayCount,
  hasAnyShiftRows,
  isShiftCalendarConfigured,
  paginateShiftRowsByDayCount,
} from '@/utils/teamMemberPageHelpers';
import type { TranslationKey } from '@/locales';

const DEFAULT_VISIBLE_DAYS = 4;
const LOAD_MORE_DAYS = 4;

interface BarberAvailabilitySectionProps {
  employeeId: string;
  shiftCalendar: TeamMemberShiftDay[] | undefined;
  branches: TeamMemberPageBranch[];
  today: string;
  locale: Locale;
  calendarConfigured: boolean;
  embedded?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
  onCollapseScroll?: () => void;
  t: (key: TranslationKey) => string;
}

const EMBEDDED_SHIFT_CARD_CLASS = 'bg-light-primary dark:bg-[#1C1C1C]';
const STANDALONE_SHIFT_CARD_CLASS = 'bg-light-secondary dark:bg-dark-secondary';
const AVAILABILITY_INFO_HINT_BORDER_CLASS = 'border border-[#632F26]';

function ShiftRow({
  row,
  employeeId,
  embedded,
  t,
}: {
  row: ReturnType<typeof flattenShiftCalendarRows>[number];
  employeeId: string;
  embedded?: boolean;
  t: (key: TranslationKey) => string;
}) {
  return (
    <View
      className={`mb-3 rounded-xl p-3 ${
        embedded ? EMBEDDED_SHIFT_CARD_CLASS : STANDALONE_SHIFT_CARD_CLASS
      }`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <ThemedText className="text-sm font-semibold">{row.dayTitle}</ThemedText>
          <ThemedText className="mt-0.5 text-sm text-light-subtext dark:text-dark-subtext">
            {row.startTime} – {row.endTime}
          </ThemedText>
        </View>
        <Button
          title={t('barberSelect')}
          variant="outline"
          size="small"
          rounded="lg"
          className="shrink-0 px-3"
          href={buildBarberBookingHref({
            employeeId,
            branchId: row.branchId,
            date: row.date,
          })}
        />
      </View>
      <View className="mt-2 min-w-0">
        <ThemedText className="text-sm font-medium">{row.branchName}</ThemedText>
        <BranchAddress
          address={row.branchAddress}
          className="mt-0.5"
          textClassName="text-xs leading-5 text-light-subtext dark:text-dark-subtext"
          numberOfLines={2}
        />
      </View>
    </View>
  );
}

export default function BarberAvailabilitySection({
  employeeId,
  shiftCalendar,
  branches,
  today,
  locale,
  calendarConfigured,
  embedded = false,
  onLayout,
  onCollapseScroll,
  t,
}: BarberAvailabilitySectionProps) {
  const allRows = useMemo(
    () => flattenShiftCalendarRows(shiftCalendar, branches, today, locale),
    [shiftCalendar, branches, today, locale]
  );
  const totalDayCount = getUniqueShiftDayCount(allRows);
  const [visibleDayCount, setVisibleDayCount] = useState(DEFAULT_VISIBLE_DAYS);
  const collapseScrollPendingRef = useRef(false);

  const visibleRows = useMemo(
    () => paginateShiftRowsByDayCount(allRows, visibleDayCount),
    [allRows, visibleDayCount]
  );

  const showLoadMore = visibleDayCount < totalDayCount;
  const showCollapse = visibleDayCount > DEFAULT_VISIBLE_DAYS;

  const handleLoadMore = () => {
    setVisibleDayCount((prev) => Math.min(totalDayCount, prev + LOAD_MORE_DAYS));
  };

  const handleLoadAll = () => {
    setVisibleDayCount(totalDayCount);
  };

  const handleCollapse = () => {
    setVisibleDayCount(DEFAULT_VISIBLE_DAYS);
    collapseScrollPendingRef.current = true;
  };

  useLayoutEffect(() => {
    if (!collapseScrollPendingRef.current) return;
    collapseScrollPendingRef.current = false;
    onCollapseScroll?.();
  }, [visibleDayCount, onCollapseScroll]);

  const renderEmptyState = () => {
    if (!calendarConfigured || !isShiftCalendarConfigured(shiftCalendar)) {
      return (
        <ThemedText className="mt-3 text-sm text-amber-700 dark:text-amber-300">
          {t('barberShiftCalendarConfigNeeded')}
        </ThemedText>
      );
    }
    if (!hasAnyShiftRows(shiftCalendar)) {
      return (
        <ThemedText className="mt-3 text-sm text-light-subtext dark:text-dark-subtext">
          {t('barberNoShifts')}
        </ThemedText>
      );
    }
    return null;
  };

  const availabilityBody = (
    <>
      {allRows.length === 0 ? (
        renderEmptyState()
      ) : (
        <View>
          {visibleRows.map((row) => (
            <ShiftRow
              key={`${row.date}-${row.branchId}-${row.startTime}-${row.endTime}`}
              row={row}
              employeeId={employeeId}
              embedded={embedded}
              t={t}
            />
          ))}

          {showLoadMore || showCollapse ? (
            <View className="mt-2 w-full">
              {showLoadMore ? (
                <>
                  <Button
                    title={t('barberLoadMoreShifts')}
                    variant="outline"
                    size="small"
                    rounded="lg"
                    onPress={handleLoadMore}
                    className="mb-3 w-full"
                  />
                  <Button
                    title={t('barberLoadAllShifts')}
                    variant="outline"
                    size="small"
                    rounded="lg"
                    onPress={handleLoadAll}
                    className={`w-full${showCollapse ? ' mb-3' : ''}`}
                  />
                </>
              ) : null}
              {showCollapse ? (
                <Button
                  title={t('barberCollapseShifts')}
                  variant="outline"
                  size="small"
                  rounded="lg"
                  onPress={handleCollapse}
                  className="w-full"
                />
              ) : null}
            </View>
          ) : null}
        </View>
      )}

      <View
        className={`rounded-xl p-3 ${AVAILABILITY_INFO_HINT_BORDER_CLASS} ${
          embedded
            ? `mt-4 ${EMBEDDED_SHIFT_CARD_CLASS}`
            : 'mt-4 bg-light-secondary dark:bg-dark-secondary'
        }`}>
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          {t('barberAvailabilityInfoHint')}
        </ThemedText>
      </View>
    </>
  );

  if (embedded) {
    return (
      <View onLayout={onLayout}>
        <ThemedText className="mb-3 text-lg font-semibold">{t('barberAvailability')}</ThemedText>
        {availabilityBody}
      </View>
    );
  }

  return (
    <View onLayout={onLayout} nativeID="dostupnost" className="mb-6 mt-8">
      <Section title={t('barberAvailability')} titleSize="lg">
        <View className="mt-3">{availabilityBody}</View>
      </Section>
    </View>
  );
}
