import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { type ActionSheetRef } from 'react-native-actions-sheet';

import ActionSheetThemed from '@/components/ActionSheetThemed';
import { Button } from '@/components/Button';
import Icon, { type IconName } from '@/components/Icon';
import { HOME_FAST_BOOK_SHEET_FOOTER } from '@/components/home/fast-book/homeFastBookSheetUi';
import { useAuth } from '@/contexts/AuthContext';
import useThemeColors from '@/contexts/ThemeColors';
import { useTranslation } from '@/hooks/useTranslation';
import type { Booking } from '@/api/bookings';
import { buildRepeatReservationHref } from '@/utils/repeatBooking';
import type { VisitPlanPastBooking } from '@/utils/visitPlanPastBookingTypes';

type SheetChoice = 'repeat' | 'detail';

const RADIO_OUTER = 20;
const RADIO_INNER = 10;

const SHEET_OPTIONS: readonly {
  id: SheetChoice;
  icon: IconName;
  titleKey: 'visitPlanPastReservationRepeatRowTitle' | 'visitPlanPastReservationDetailRowTitle';
  subtitleKey:
    | 'visitPlanPastReservationRepeatRowSubtitle'
    | 'visitPlanPastReservationDetailRowSubtitle';
}[] = [
  {
    id: 'repeat',
    icon: 'Repeat2',
    titleKey: 'visitPlanPastReservationRepeatRowTitle',
    subtitleKey: 'visitPlanPastReservationRepeatRowSubtitle',
  },
  {
    id: 'detail',
    icon: 'FileText',
    titleKey: 'visitPlanPastReservationDetailRowTitle',
    subtitleKey: 'visitPlanPastReservationDetailRowSubtitle',
  },
] as const;

function SheetRadioDot({ selected }: { selected: boolean }) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.radioOuter,
        { borderColor: selected ? colors.text : `${colors.text}66` },
      ]}>
      {selected ? (
        <View style={[styles.radioInner, { backgroundColor: colors.text }]} />
      ) : null}
    </View>
  );
}

type Props = {
  booking: VisitPlanPastBooking | null;
  templateBooking: Booking | null;
  sheetRef: React.RefObject<ActionSheetRef | null>;
  onClose: () => void;
};

export default function VisitPlanPastReservationActionSheet({
  booking,
  templateBooking,
  sheetRef,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { apiToken } = useAuth();
  const [choice, setChoice] = useState<SheetChoice>('repeat');

  const sheetAriaLabel = t('visitPlanPastReservationSheetAriaLabel');
  const detailHref = useMemo(() => {
    if (!booking?.id || !apiToken) return null;
    return `/screens/booking-detail?id=${encodeURIComponent(booking.id)}`;
  }, [booking?.id, apiToken]);

  useEffect(() => {
    if (booking) setChoice('repeat');
  }, [booking?.id]);

  const detailDisabled = detailHref == null;
  const nextDisabled =
    (choice === 'detail' && detailDisabled) ||
    (choice === 'repeat' && templateBooking == null);

  const handleNext = () => {
    if (nextDisabled || !booking) return;
    onClose();
    if (choice === 'detail' && detailHref) {
      router.push(detailHref as never);
      return;
    }
    if (choice === 'repeat' && templateBooking) {
      router.push(buildRepeatReservationHref(templateBooking) as never);
    }
  };

  return (
    <ActionSheetThemed ref={sheetRef} fitContent gestureEnabled onClose={onClose}>
      {booking ? (
        <View>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={sheetAriaLabel}
            style={styles.optionsBlock}>
            {SHEET_OPTIONS.map((option) => {
              const selected = choice === option.id;
              const rowDisabled = option.id === 'detail' && detailDisabled;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled: rowDisabled }}
                  disabled={rowDisabled}
                  onPress={() => setChoice(option.id)}
                  style={({ pressed }) => [
                    styles.optionRow,
                    rowDisabled ? styles.optionRowDisabled : null,
                    pressed && !rowDisabled ? styles.optionRowPressed : null,
                  ]}>
                  <Icon name={option.icon} size={20} color={colors.text} style={styles.optionIcon} />
                  <View style={styles.optionCopy}>
                    <Text
                      style={[
                        styles.optionTitle,
                        { color: colors.text },
                        rowDisabled ? styles.optionTextDisabled : null,
                      ]}>
                      {t(option.titleKey)}
                    </Text>
                    <Text
                      style={[
                        styles.optionSubtitle,
                        { color: colors.placeholder },
                        rowDisabled ? styles.optionTextDisabled : null,
                      ]}>
                      {t(option.subtitleKey)}
                    </Text>
                  </View>
                  <SheetRadioDot selected={selected} />
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button
              title={t('visitPlanPastReservationSheetNext')}
              variant="ghost"
              size="medium"
              className="w-full py-4"
              disabled={nextDisabled}
              onPress={handleNext}
              style={{ backgroundColor: colors.text, minHeight: 44, opacity: nextDisabled ? 0.45 : 1 }}
              textClassName={`font-medium ${colors.isDark ? 'text-[#0f0f0f]' : 'text-white'}`}
            />
          </View>
        </View>
      ) : null}
    </ActionSheetThemed>
  );
}

const styles = StyleSheet.create({
  optionsBlock: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 0,
    gap: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  optionRowPressed: { opacity: 0.85 },
  optionRowDisabled: { opacity: 0.5 },
  optionTextDisabled: { opacity: 0.85 },
  optionIcon: { marginTop: 2 },
  optionCopy: { flex: 1, minWidth: 0 },
  optionTitle: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  optionSubtitle: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  radioOuter: {
    width: RADIO_OUTER,
    height: RADIO_OUTER,
    marginTop: 2,
    borderRadius: RADIO_OUTER / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: RADIO_INNER,
    height: RADIO_INNER,
    borderRadius: RADIO_INNER / 2,
  },
  footer: {
    borderTopWidth: 1,
    ...HOME_FAST_BOOK_SHEET_FOOTER,
  },
});
