import { Image } from 'expo-image';
import React, { forwardRef, useCallback, useRef } from 'react';
import { Clipboard, Pressable, useWindowDimensions, View } from 'react-native';
import { ActionSheetRef, ScrollView } from 'react-native-actions-sheet';

import type { ClientCoupon } from '@/api/client-coupons';
import { useTranslation } from '@/app/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import { ClientCouponValidityPills } from '@/components/ClientCouponValidityPills';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { resolveClientCouponValidity } from '@/utils/clientCouponFormat';

export interface ClientCouponDetailSheetProps {
  coupon: ClientCoupon | null;
  onDismiss?: () => void;
}

export const ClientCouponDetailSheet = forwardRef<ActionSheetRef, ClientCouponDetailSheetProps>(
  function ClientCouponDetailSheet({ coupon, onDismiss }, ref) {
    const { t, locale } = useTranslation();
    const { height: windowHeight } = useWindowDimensions();
    const innerRef = useRef<ActionSheetRef | null>(null);

    const setRef = useCallback(
      (node: ActionSheetRef | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref != null) (ref as React.MutableRefObject<ActionSheetRef | null>).current = node;
      },
      [ref]
    );

    const validityModel =
      coupon != null
        ? resolveClientCouponValidity(coupon.validFrom, coupon.validUntil, locale)
        : null;

    return (
      <ActionSheetThemed
        ref={setRef}
        gestureEnabled
        onClose={() => {
          onDismiss?.();
        }}>
        <View className="pb-8 pt-1">
          {!coupon ? (
            <View className="px-4 py-6">
              <ThemedText className="text-center text-sm text-light-subtext dark:text-dark-subtext">
                —
              </ThemedText>
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight: Math.round(windowHeight * 0.82) }}
              className="px-4 pt-3"
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled">
              {coupon.imageUrl?.trim() ? (
                <Image
                  source={{ uri: coupon.imageUrl.trim() }}
                  className="mb-4 h-44 w-full rounded-xl bg-light-secondary dark:bg-dark-secondary"
                  contentFit="cover"
                />
              ) : null}

              <ThemedText className="mb-4 min-w-0 text-3xl font-semibold text-light-text dark:text-dark-text">
                {coupon.name}
              </ThemedText>

              <View className="mb-4">
                <ThemedText className="mb-1 text-xs uppercase tracking-wide text-light-subtext dark:text-dark-subtext">
                  {t('homeCouponDetailBenefitLabel')}
                </ThemedText>
                <ThemedText className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  {coupon.benefitLabel}
                </ThemedText>
              </View>

              {coupon.description?.trim() ? (
                <View className="mb-4">
                  <ThemedText className="mb-1 text-xs uppercase tracking-wide text-light-subtext dark:text-dark-subtext">
                    {t('homeCouponDescriptionLabel')}
                  </ThemedText>
                  <ThemedText className="whitespace-pre-line text-base text-light-text dark:text-dark-text">
                    {coupon.description.trim()}
                  </ThemedText>
                </View>
              ) : null}

              {validityModel ? (
                <View className="mb-4">
                  <ThemedText className="mb-1 text-xs uppercase tracking-wide text-light-subtext dark:text-dark-subtext">
                    {t('homeCouponValidityLabel')}
                  </ThemedText>
                  <ClientCouponValidityPills
                    validFrom={coupon.validFrom}
                    validUntil={coupon.validUntil}
                    locale={locale}
                    t={t}
                    variant="sheet"
                  />
                </View>
              ) : null}

              {!coupon.applicableToAll ? (
                <View className="mb-4">
                  <ThemedText className="mb-1 text-xs uppercase tracking-wide text-light-subtext dark:text-dark-subtext">
                    {t('homeCouponDetailScopeLabel')}
                  </ThemedText>
                  <ThemedText className="text-sm text-light-text dark:text-dark-text">
                    {t('homeCouponLimitedScope')}
                  </ThemedText>
                </View>
              ) : null}

              <View className="mb-2">
                <ThemedText className="mb-1 text-xs uppercase tracking-wide text-light-subtext dark:text-dark-subtext">
                  {t('bookingCouponCodeLabel')}
                </ThemedText>
                <Pressable
                  onPress={() => Clipboard.setString(coupon.code)}
                  className="flex-row items-center gap-2 rounded-xl bg-light-secondary px-3 py-3 active:opacity-80 dark:bg-dark-secondary">
                  <ThemedText className="min-w-0 flex-1 font-mono text-base text-light-text dark:text-dark-text">
                    {coupon.code}
                  </ThemedText>
                  <Icon
                    name="Copy"
                    size={18}
                    className="shrink-0 text-light-subtext dark:text-dark-subtext"
                  />
                </Pressable>
                <ThemedText className="mt-1 text-xs text-light-subtext dark:text-dark-subtext">
                  {t('homeCouponCopyCode')}
                </ThemedText>
              </View>
            </ScrollView>
          )}
        </View>
      </ActionSheetThemed>
    );
  }
);
