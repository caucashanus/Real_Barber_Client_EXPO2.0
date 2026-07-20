import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, View, useWindowDimensions } from 'react-native';

import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import LiveIndicator from '@/components/LiveIndicator';
import ThemedText from '@/components/ThemedText';
import {
  buildBarberBookingHref,
  getShiftLiveIndicatorVariant,
  type TodayShiftStatus,
} from '@/utils/teamMemberPageHelpers';
import { openOperatorPhone } from '@/utils/operatorContact';
import type { TranslationKey } from '@/locales';

export const BARBER_DETAIL_HEADER_HEIGHT = 64;

interface BarberStickyBarProps {
  visible: boolean;
  displayName: string;
  employeeId: string;
  shiftStatus: TodayShiftStatus;
  topInset: number;
  t: (key: TranslationKey) => string;
}

export default function BarberStickyBar({
  visible,
  displayName,
  employeeId,
  shiftStatus,
  topInset,
  t,
}: BarberStickyBarProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const contentOpacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const liveVariant = getShiftLiveIndicatorVariant(shiftStatus);
  const reserveHref = buildBarberBookingHref({ employeeId });

  useEffect(() => {
    Animated.timing(contentOpacity, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [visible, contentOpacity]);

  if (!isMobile) return null;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.push('/(tabs)/(home)/experience');
  };

  const handlePhone = () => {
    openOperatorPhone().catch(() => {});
  };

  return (
    <View
      style={{
        paddingTop: topInset,
        height: topInset + BARBER_DETAIL_HEADER_HEIGHT,
      }}
      className={`absolute left-0 right-0 z-40 bg-light-primary dark:bg-dark-primary ${
        visible ? 'border-b border-light-secondary dark:border-dark-secondary' : ''
      }`}>
      <View className="h-16 flex-row items-center gap-2 px-global">
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel={t('commonBack')}
          className="h-10 w-10 shrink-0 items-center justify-center active:opacity-70">
          <Icon name="ArrowLeft" size={22} />
        </Pressable>

        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          accessibilityElementsHidden={!visible}
          importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
          style={{ opacity: contentOpacity }}
          className="min-w-0 flex-1 flex-row items-center gap-2">
          <View className="min-w-0 flex-1 flex-row items-center">
            <ThemedText className="shrink text-base font-semibold" numberOfLines={1}>
              {displayName}
            </ThemedText>
            {liveVariant ? (
              <View className="ml-3 justify-center">
                <LiveIndicator variant={liveVariant} size="sm" />
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={handlePhone}
            accessibilityRole="button"
            accessibilityLabel={t('barberPhoneCall')}
            className="h-8 w-8 shrink-0 items-center justify-center rounded-full bg-light-secondary active:opacity-70 dark:bg-dark-secondary">
            <Icon name="Phone" size={14} />
          </Pressable>

          <Button
            title={t('commonReserve')}
            variant="primary"
            size="small"
            rounded="lg"
            className="shrink-0 px-3"
            href={reserveHref}
          />
        </Animated.View>
      </View>
    </View>
  );
}
