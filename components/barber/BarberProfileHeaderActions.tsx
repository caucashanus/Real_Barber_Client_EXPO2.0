import { router } from 'expo-router';
import React, { useRef } from 'react';
import { Pressable, Share, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import Favorite from '@/components/Favorite';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import ThemedText from '@/components/ThemedText';
import { buildBarberBookingHref } from '@/utils/teamMemberPageHelpers';
import type { TranslationKey } from '@/locales';

interface BarberProfileHeaderActionsProps {
  employeeId: string;
  displayName: string;
  shareMessage: string;
  onScrollToReviews: () => void;
  t: (key: TranslationKey) => string;
}

export default function BarberProfileHeaderActions({
  employeeId,
  displayName,
  shareMessage,
  onScrollToReviews,
  t,
}: BarberProfileHeaderActionsProps) {
  const menuSheetRef = useRef<ActionSheetRef>(null);

  const handleShare = () => {
    menuSheetRef.current?.hide();
    setTimeout(() => {
      void Share.share({
        message: shareMessage,
        title: displayName,
      }).catch(() => {});
    }, 300);
  };

  const handleRate = () => {
    menuSheetRef.current?.hide();
    setTimeout(() => {
      onScrollToReviews();
    }, 200);
  };

  const handleBook = () => {
    menuSheetRef.current?.hide();
    setTimeout(() => {
      router.push(buildBarberBookingHref({ employeeId }) as never);
    }, 200);
  };

  return (
    <>
      <View className="shrink-0 flex-row items-center gap-1">
        <Favorite
          productName={displayName}
          title={displayName}
          entityType="employee"
          entityId={employeeId}
          size={22}
        />
        <Pressable
          onPress={() => menuSheetRef.current?.show()}
          accessibilityRole="button"
          accessibilityLabel={t('barberMenuOpen')}
          className="h-10 w-10 items-center justify-center active:opacity-70">
          <Icon name="EllipsisVertical" size={22} />
        </Pressable>
      </View>

      <ActionSheetThemed ref={menuSheetRef} gestureEnabled>
        <View className="gap-3 px-4 pb-8 pt-2">
          <ThemedText className="mb-1 text-center text-base font-semibold">
            {displayName}
          </ThemedText>
          <Button
            title={t('barberMenuShare')}
            variant="outline"
            iconStart="Share2"
            onPress={handleShare}
          />
          <Button
            title={t('barberMenuRate')}
            variant="outline"
            iconStart="Star"
            onPress={handleRate}
          />
          <Button
            title={t('barberMenuBook')}
            variant="primary"
            iconStart="CalendarPlus"
            onPress={handleBook}
          />
        </View>
      </ActionSheetThemed>
    </>
  );
}
