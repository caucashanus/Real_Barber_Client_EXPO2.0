import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Clipboard, Pressable, View } from 'react-native';

import { getClientCoupons, type ClientCoupon } from '@/api/client-coupons';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { ClientCouponValidityPills } from '@/components/ClientCouponValidityPills';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import { resolveClientCouponValidity } from '@/utils/clientCouponFormat';

function useCouponIdParam(): string | undefined {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  return typeof id === 'string' ? id : id?.[0];
}

export default function ClientCouponDetailScreen() {
  const { apiToken } = useAuth();
  const { t, locale } = useTranslation();
  const couponId = useCouponIdParam();

  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState<ClientCoupon | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!apiToken || !couponId) {
      setLoading(false);
      setCoupon(null);
      setLoadError(null);
      return;
    }

    setLoading(true);
    setLoadError(null);

    (async () => {
      try {
        const list = await getClientCoupons(apiToken);
        if (cancelled) return;
        const found = list.find((c) => c.id === couponId) ?? null;
        setCoupon(found);
        setLoadError(null);
      } catch (e) {
        if (!cancelled) {
          setCoupon(null);
          setLoadError(e instanceof Error && e.message ? e.message : t('bookingLoadFailed'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiToken, couponId, t]);

  const validityModel = useMemo(() => {
    if (coupon == null) return null;
    return resolveClientCouponValidity(coupon.validFrom, coupon.validUntil, locale);
  }, [coupon, locale]);

  const hasCouponImage =
    coupon != null && coupon.imageUrl != null && coupon.imageUrl.trim().length > 0;

  if (!apiToken) {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <Header showBackButton />
        <ThemeScroller>
          <Section
            titleSize="3xl"
            className="px-4 pb-6 pt-4"
            title={t('homePromoSectionTitle')}
            subtitle={t('communicationSettingsNeedLogin')}
          />
        </ThemeScroller>
      </View>
    );
  }

  if (!couponId) {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <Header showBackButton />
        <ThemeScroller>
          <Section
            titleSize="3xl"
            className="px-4 pb-6 pt-4"
            title={t('homePromoSectionTitle')}
            subtitle={t('homeCouponDetailNotFound')}
          />
        </ThemeScroller>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <Header showBackButton />
        <View className="flex-1 items-center justify-center py-12">
          <ActivityIndicator size="small" />
          <ThemedText className="mt-3 text-sm text-light-subtext dark:text-dark-subtext">
            {t('commonLoading')}
          </ThemedText>
        </View>
      </View>
    );
  }

  if (loadError) {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <Header showBackButton />
        <ThemeScroller>
          <Section titleSize="3xl" className="px-4 pb-6 pt-4" title={t('homePromoSectionTitle')} />
          <View className="px-4 pb-6">
            <ThemedText className="text-sm leading-6 text-light-subtext dark:text-dark-subtext">
              {loadError}
            </ThemedText>
          </View>
        </ThemeScroller>
      </View>
    );
  }

  if (!coupon) {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <Header showBackButton />
        <ThemeScroller>
          <Section
            titleSize="3xl"
            className="px-4 pb-6 pt-4"
            title={t('homePromoSectionTitle')}
            subtitle={t('homeCouponDetailNotFound')}
          />
        </ThemeScroller>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton />
      <ThemeScroller>
        <View className="bg-light-primary pb-8 pt-4 dark:bg-dark-primary">
          <Section title={coupon.name} titleSize="3xl" className="px-0 pb-2" />

          <View className="pb-3">
            <ThemedText className="mb-1 text-xs uppercase tracking-wide text-light-subtext dark:text-dark-subtext">
              {t('homeCouponDetailBenefitLabel')}
            </ThemedText>
            <ThemedText className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              {coupon.benefitLabel}
            </ThemedText>
          </View>

          {hasCouponImage ? (
            <View className="mb-3 overflow-hidden rounded-[15px] bg-light-secondary dark:bg-dark-secondary">
              <Image
                source={{ uri: coupon.imageUrl!.trim() }}
                style={{ width: '100%', height: 152 }}
                className="bg-light-secondary dark:bg-dark-secondary"
                contentFit="cover"
              />
            </View>
          ) : null}

          <View className="pb-4">
            <ThemedText className="mb-1 text-xs uppercase tracking-wide text-light-subtext dark:text-dark-subtext">
              {t('homeCouponSheetCodeLabel')}
            </ThemedText>
            <View className="w-full flex-row justify-center">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${coupon.code}. ${t('homeCouponCopyCode')}`}
                onPress={() => Clipboard.setString(coupon.code)}
                className="flex-row items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-light-secondary px-3 py-1.5 active:opacity-80 dark:border-dark-secondary dark:bg-dark-secondary">
                <ThemedText
                  className="text-center font-mono text-sm font-semibold text-light-text dark:text-dark-text"
                  numberOfLines={1}>
                  {coupon.code}
                </ThemedText>
                <Icon
                  name="Copy"
                  size={14}
                  className="shrink-0 text-light-subtext dark:text-dark-subtext"
                />
              </Pressable>
            </View>
          </View>

          {coupon.description?.trim() ? (
            <View className="pb-4">
              <ThemedText className="mb-1 text-xs uppercase tracking-wide text-light-subtext dark:text-dark-subtext">
                {t('homeCouponDescriptionLabel')}
              </ThemedText>
              <ThemedText className="whitespace-pre-line text-base text-light-text dark:text-dark-text">
                {coupon.description.trim()}
              </ThemedText>
            </View>
          ) : null}

          {validityModel ? (
            <View className="pb-4">
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
        </View>
      </ThemeScroller>
    </View>
  );
}
