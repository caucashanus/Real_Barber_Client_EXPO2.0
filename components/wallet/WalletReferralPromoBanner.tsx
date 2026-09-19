import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import useThemeColors from '@/contexts/ThemeColors';
import { getClientReferralSlug, referralDashboardHref } from '@/utils/referralDashboardHelpers';
import { useTranslation } from '@/hooks/useTranslation';
import Icon from '@/components/Icon';
import SurfaceCard from '@/components/layout/SurfaceCard';
import ThemedText from '@/components/ThemedText';

const WALLET_REFERRAL_PROMO_COVER = require('@/assets/img/wallet-promo.webp');

const BANNER_HEIGHT = 140;
/** Rozměry assets/img/wallet-promo.webp — široká ilustrace, contain bez ořezu. */
const PROMO_IMAGE_ASPECT = 736 / 292;

const styles = StyleSheet.create({
  cardBody: {
    height: BANNER_HEIGHT,
    width: '100%',
  },
  dismiss: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 2,
  },
  imageLayer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    top: 0,
  },
  textLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'flex-start',
    padding: 14,
  },
});

interface WalletReferralPromoBannerProps {
  rewardCzk: number;
  onDismiss: () => void;
}

function formatRewardCzk(value: number): string {
  return value.toLocaleString('cs-CZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function WalletReferralPromoBanner({
  rewardCzk,
  onDismiss,
}: WalletReferralPromoBannerProps) {
  const router = useRouter();
  const { client } = useAuth();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { width: screenWidth } = useWindowDimensions();
  const rewardLabel = formatRewardCzk(rewardCzk);

  const cardWidth = screenWidth - 48;
  const promoImageWidth = Math.min(BANNER_HEIGHT * PROMO_IMAGE_ASPECT, cardWidth);
  const textPaddingRight = Math.max(promoImageWidth * 0.38, 120);

  const openReferral = () => {
    if (!client?.id) return;
    router.push(referralDashboardHref(getClientReferralSlug(client.id)));
  };

  return (
    <SurfaceCard rounded="2xl" className="overflow-hidden">
      <View style={styles.cardBody}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('walletReferralPromoOpenA11y')}
          onPress={openReferral}
          style={styles.cardBody}
          className="active:opacity-70">
          <View pointerEvents="none" style={[styles.textLayer, { paddingRight: textPaddingRight }]}>
            <ThemedText className="text-base font-semibold">
              {t('walletReferralPromoTitle')}
            </ThemedText>
            <ThemedText className="mt-1.5 text-xs leading-5">
              {t('walletReferralPromoBodyPrefix')}
              <ThemedText className="text-base font-semibold">{rewardLabel} Kč</ThemedText>
              {t('walletReferralPromoBodySuffix')}
            </ThemedText>
          </View>

          <View pointerEvents="none" style={[styles.imageLayer, { width: promoImageWidth }]}>
            <Image
              source={WALLET_REFERRAL_PROMO_COVER}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              contentPosition="right bottom"
              accessibilityIgnoresInvertColors
            />
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('walletReferralPromoDismissA11y')}
          hitSlop={8}
          onPress={onDismiss}
          style={styles.dismiss}
          className="items-center justify-center">
          <Icon name="X" size={16} color={colors.text} />
        </Pressable>
      </View>
    </SurfaceCard>
  );
}
