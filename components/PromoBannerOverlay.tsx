import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PromoBanner } from '@/api/promoBanner';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import { useTranslation } from '@/hooks/useTranslation';

interface PromoBannerOverlayProps {
  banner: PromoBanner;
  visible: boolean;
  onDismiss: () => void;
  onCtaPress: () => void;
}

export default function PromoBannerOverlay({
  banner,
  visible,
  onDismiss,
  onCtaPress,
}: PromoBannerOverlayProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const showCta = Boolean(banner.ctaLabel?.trim() && banner.ctaUrl?.trim());

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      transparent={false}
      onRequestClose={onDismiss}>
      <View className="flex-1 bg-black">
        <StatusBar style="light" />
        <Image
          source={{ uri: banner.imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          accessibilityLabel={t('promoBannerImageA11y')}
        />

        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={t('promoBannerCloseA11y')}
          hitSlop={12}
          className="absolute z-10 items-center justify-center rounded-full bg-black/50 active:opacity-80"
          style={{
            top: insets.top + 8,
            right: 16,
            width: 40,
            height: 40,
          }}>
          <Icon name="X" size={22} color="#FFFFFF" />
        </Pressable>

        {showCta ? (
          <View
            className="absolute bottom-0 left-0 right-0 px-global"
            style={{ paddingBottom: insets.bottom + 16 }}>
            <Button
              title={banner.ctaLabel!.trim()}
              onPress={onCtaPress}
              size="large"
              rounded="xl"
            />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
