import React from 'react';
import { Modal, Pressable } from 'react-native';

import { Button } from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';

interface BookingDetailCalendarPromoModalProps {
  visible: boolean;
  sheetBackgroundColor: string;
  onClose: () => void;
  onAddToCalendar: () => void;
  t: (key: TranslationKey) => string;
}

export default function BookingDetailCalendarPromoModal({
  visible,
  sheetBackgroundColor,
  onClose,
  onAddToCalendar,
  t,
}: BookingDetailCalendarPromoModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/50" onPress={onClose}>
        <Pressable
          className="gap-3 rounded-t-3xl px-4 pb-10 pt-4"
          style={{ backgroundColor: sheetBackgroundColor }}
          onPress={(e) => e.stopPropagation?.()}>
          <ThemedText variant="emphasis" className="mb-1 text-center">
            {t('bookingDetailPostBookingCalendarTitle')}
          </ThemedText>
          <ThemedText className="text-center text-sm text-light-subtext dark:text-dark-subtext">
            {t('bookingDetailPostBookingCalendarMessage')}
          </ThemedText>
          <Button
            title={t('bookingAddToCalendar')}
            onPress={onAddToCalendar}
            variant="primary"
            iconStart="CalendarPlus"
          />
          <Button
            title={t('bookingDetailPostBookingCalendarLater')}
            onPress={onClose}
            variant="secondary"
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
