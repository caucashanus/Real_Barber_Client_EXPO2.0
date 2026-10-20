import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type ImageSourcePropType } from 'react-native';
import type { ActionSheetRef } from 'react-native-actions-sheet';

import type { Booking } from '@/api/bookings';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import { Button } from '@/components/Button';
import { HOME_FAST_BOOK_SHEET_FOOTER } from '@/components/home/fast-book/homeFastBookSheetUi';
import Switch from '@/components/forms/Switch';
import ThemedText from '@/components/ThemedText';
import { VISIT_PLAN_DAY_BOOKING_LOCK_ICONS } from '@/constants/visitPlanDayBookingLockIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import useThemeColors from '@/contexts/ThemeColors';
import { useTranslation } from '@/hooks/useTranslation';
import {
  buildVisitPlanBookingHref,
  prepareVisitPlanClassicBookingNavigation,
} from '@/utils/buildVisitPlanBookingHref';
import { formatVisitPlanDayMonthLong } from '@/utils/visitPlanDates';
import {
  applyVisitPlanLockChange,
  DEFAULT_VISIT_PLAN_BOOKING_LOCKS,
  type VisitPlanBookingLocks,
} from '@/utils/visitPlanBookingLocks';

type Props = {
  dateIso: string | null;
  templateBooking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function LockRow({
  label,
  iconSource,
  value,
  onValueChange,
}: {
  label: string;
  iconSource: ImageSourcePropType;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3 border-b border-light-secondary py-3 dark:border-dark-secondary">
      <View className="min-w-0 flex-1 flex-row items-center gap-3">
        <Image
          source={iconSource}
          style={{ width: 40, height: 40 }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
        <ThemedText className="text-base">{label}</ThemedText>
      </View>
      <Switch value={value} onChange={onValueChange} />
    </View>
  );
}

export default function VisitPlanDayBookingSheet({
  dateIso,
  templateBooking,
  open,
  onOpenChange,
}: Props) {
  const ref = useRef<ActionSheetRef>(null);
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const colors = useThemeColors();
  const [locks, setLocks] = useState<VisitPlanBookingLocks>(DEFAULT_VISIT_PLAN_BOOKING_LOCKS);

  const sheetOpen = open && dateIso != null;
  const hasTemplate = templateBooking != null;

  useEffect(() => {
    if (open && dateIso) ref.current?.show();
    else ref.current?.hide();
  }, [open, dateIso]);

  useEffect(() => {
    if (sheetOpen) {
      setLocks(DEFAULT_VISIT_PLAN_BOOKING_LOCKS);
    }
  }, [sheetOpen, dateIso]);

  const sheetTitle = hasTemplate
    ? t('visitPlanDayBookingSheetTitle')
    : t('visitPlanDayBookingSheetNoPastPrompt');

  const dateLabel =
    hasTemplate && dateIso ? formatVisitPlanDayMonthLong(dateIso, locale) : '';

  const setLock = (key: keyof VisitPlanBookingLocks, value: boolean) => {
    setLocks((prev) => applyVisitPlanLockChange(prev, key, value));
  };

  const handleContinue = async () => {
    if (!dateIso) return;
    onOpenChange(false);

    if (hasTemplate && templateBooking) {
      const href = buildVisitPlanBookingHref(templateBooking, { date: dateIso, locks });
      router.push(href as never);
      return;
    }

    const href = await prepareVisitPlanClassicBookingNavigation();
    router.push(href as never);
  };

  return (
    <ActionSheetThemed
      ref={ref}
      fitContent
      gestureEnabled
      onClose={() => onOpenChange(false)}
      containerStyle={{ zIndex: 220, elevation: 24 }}>
      <View className="px-global pt-2">
        <ThemedText className="mb-4 text-lg font-semibold">{sheetTitle}</ThemedText>

        {hasTemplate ? (
          <>
            {dateLabel ? (
              <ThemedText className="text-base font-semibold">{dateLabel}</ThemedText>
            ) : null}
            <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
              {t('visitPlanDayBookingSheetNextStepHint')}
            </ThemedText>

            <View className="mt-4">
              <ThemedText className="mb-1 text-sm font-semibold">
                {t('visitPlanDayBookingLocksHeading')}
              </ThemedText>
              <LockRow
                label={t('visitPlanDayBookingLockService')}
                iconSource={VISIT_PLAN_DAY_BOOKING_LOCK_ICONS.service}
                value={locks.service}
                onValueChange={(v) => setLock('service', v)}
              />
              <LockRow
                label={t('visitPlanDayBookingLockBranch')}
                iconSource={VISIT_PLAN_DAY_BOOKING_LOCK_ICONS.branch}
                value={locks.branch}
                onValueChange={(v) => setLock('branch', v)}
              />
              <LockRow
                label={t('visitPlanDayBookingLockEmployee')}
                iconSource={VISIT_PLAN_DAY_BOOKING_LOCK_ICONS.employee}
                value={locks.employee}
                onValueChange={(v) => setLock('employee', v)}
              />
            </View>
          </>
        ) : null}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Button
          title={t('visitPlanIntroContinue')}
          variant="ghost"
          size="medium"
          className="w-full py-4"
          disabled={!dateIso}
          onPress={() => void handleContinue()}
          style={{ backgroundColor: colors.text, minHeight: 44 }}
          textClassName={`font-medium ${colors.isDark ? 'text-[#0f0f0f]' : 'text-white'}`}
        />
      </View>
    </ActionSheetThemed>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    ...HOME_FAST_BOOK_SHEET_FOOTER,
  },
});
