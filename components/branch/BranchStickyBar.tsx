import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, View, useWindowDimensions } from 'react-native';

import Icon from '@/components/Icon';
import LiveIndicator from '@/components/LiveIndicator';
import ReserveButton from '@/components/ReserveButton';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import { getBranchOpenLiveVariant } from '@/utils/branchOpenStatusLive';
import { getBranchOpenStatus } from '@/utils/branchOpenStatus';

export const BRANCH_DETAIL_HEADER_HEIGHT = 64;

interface BranchStickyBarProps {
  visible: boolean;
  branchName: string;
  bookingHref: string;
  topInset: number;
  t: (key: TranslationKey) => string;
  onPhonePress: () => void;
}

export default function BranchStickyBar({
  visible,
  branchName,
  bookingHref,
  topInset,
  t,
  onPhonePress,
}: BranchStickyBarProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const contentOpacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const openVariant = getBranchOpenLiveVariant(getBranchOpenStatus());

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
    router.push('/(tabs)/(home)/branches');
  };

  return (
    <View
      style={{
        paddingTop: topInset,
        height: topInset + BRANCH_DETAIL_HEADER_HEIGHT,
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
              {branchName}
            </ThemedText>
            <View className="ml-3 justify-center">
              <LiveIndicator variant={openVariant} size="default" />
            </View>
          </View>

          <Pressable
            onPress={onPhonePress}
            accessibilityRole="button"
            accessibilityLabel={t('barberPhoneCall')}
            className="h-8 w-8 shrink-0 items-center justify-center rounded-full bg-light-secondary active:opacity-70 dark:bg-dark-secondary">
            <Icon name="Phone" size={14} />
          </Pressable>

          <ReserveButton
            title={t('commonReserve')}
            size="sm"
            rounded="lg"
            className="shrink-0 px-3"
            href={bookingHref}
          />
        </Animated.View>
      </View>
    </View>
  );
}
