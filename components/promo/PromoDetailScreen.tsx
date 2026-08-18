import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from "expo-router/react-navigation";
import React, { useCallback, useContext, useMemo, useRef } from 'react';
import {
  Animated,
  ScrollView,
  View,
  useWindowDimensions} from 'react-native';

import { ScrollContext } from '@/app/(tabs)/(home)/_layout';
import type { ClientCoupon } from '@/api/client-coupons';
import type { ClientPoster } from '@/api/client-posters';
import { ClientCouponValidityPills } from '@/components/ClientCouponValidityPills';
import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import PromoCouponCodeRow from '@/components/promo/PromoCouponCodeRow';
import ReserveButton from '@/components/ReserveButton';
import SiteBreadcrumbs from '@/components/shared/SiteBreadcrumbs';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { PROMO_KUPON_SEGMENT, PROMO_POSTER_SEGMENT } from '@/constants/promoDetailRoutes';
import useThemeColors from '@/contexts/ThemeColors';
import { usePromoDetailScreen } from '@/hooks/usePromoDetailScreen';
import { useTranslation } from '@/hooks/useTranslation';
import { promoBreadcrumbItems } from '@/utils/breadcrumbs';
import {
  CONTENT_CAROUSEL_ASPECT_RATIO,
  CONTENT_HORIZONTAL_PADDING} from '@/utils/contentCarouselLayout';
import { openPromoTargetUrl } from '@/utils/openPromoTargetUrl';
import SiteLoadingState from '@/components/SiteLoadingState';

function PromoHeroImage({ uri, width, height }: { uri: string; width: number; height: number }) {
  return (
    <View
      className="overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-secondary"
      style={{ width, height }}>
      <Image source={{ uri }} style={{ width, height }} contentFit="cover" />
    </View>
  );
}

export default function PromoDetailScreen() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  const { t, locale } = useTranslation();
  const scrollY = useContext(ScrollContext);
  const colors = useThemeColors();
  const { width: winWidth } = useWindowDimensions();
  const isMobileHeader = winWidth < 768;

  const { data, loading, error } = usePromoDetailScreen(kind ?? '', id ?? '');
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollY.setValue(0);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [scrollY])
  );

  const heroWidth = isMobileHeader
    ? winWidth - CONTENT_HORIZONTAL_PADDING
    : Math.min(360, Math.round(winWidth * 0.38));
  const heroHeight = Math.round(heroWidth / CONTENT_CAROUSEL_ASPECT_RATIO);

  const breadcrumbItems = useMemo(() => {
    if (!data) return [];
    const title =
      data.kind === PROMO_POSTER_SEGMENT
        ? data.poster.title?.trim() || t('homePromoSectionTitle')
        : data.coupon.name;
    return promoBreadcrumbItems(title, t);
  }, [data, t]);

  if (loading) {
    return (
      <SiteLoadingState layout="section" />
    );
  }

  if (!data || error) {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        {!isMobileHeader ? <Header showBackButton /> : null}
        <View className="flex-1 items-center justify-center p-6">
          <ThemedText className="text-center text-amber-700 dark:text-amber-300">
            {t('homeCouponDetailNotFound')}
          </ThemedText>
        </View>
      </View>
    );
  }

  const heroUri =
    data.kind === PROMO_POSTER_SEGMENT
      ? data.poster.imageUrl?.trim()
      : data.coupon.imageUrl?.trim();

  const renderPosterContent = (poster: ClientPoster) => {
    const eyebrow = poster.buttonText?.trim() || '';
    const title = poster.title?.trim() || t('homePromoSectionTitle');
    const subtitle = poster.subtitle?.trim() || '';
    const targetUrl = poster.websiteUrl?.trim() || poster.videoUrl?.trim() || '';
    const ctaLabel = poster.buttonText?.trim() || title;

    return (
      <>
        {eyebrow ? (
          <ThemedText
            className="mb-2 text-xs font-semibold uppercase tracking-wide"
            style={{ color: colors.highlight }}>
            {eyebrow}
          </ThemedText>
        ) : null}
        <ThemedText className="text-3xl font-semibold" numberOfLines={4}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText className="mt-3 text-base leading-6 text-light-subtext dark:text-dark-subtext">
            {subtitle}
          </ThemedText>
        ) : null}
        {targetUrl ? (
          <View className="mt-6">
            <AppButton
              title={ctaLabel}
              fullWidth
              onPress={() => {
                void openPromoTargetUrl(targetUrl).catch(() => {});
              }}
            />
          </View>
        ) : null}
      </>
    );
  };

  const renderCouponContent = (coupon: ClientCoupon) => {
    return (
      <>
        <ThemedText
          className="mb-2 text-xs font-semibold uppercase tracking-wide"
          style={{ color: colors.highlight }}>
          {t('homePromoBadgeCoupon')}
        </ThemedText>
        <ThemedText className="text-3xl font-semibold" numberOfLines={4}>
          {coupon.name}
        </ThemedText>

        {coupon.benefitLabel?.trim() ? (
          <View className="mt-3">
            <ThemedText className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              {coupon.benefitLabel}
            </ThemedText>
          </View>
        ) : null}

        <View className="mt-3">
          <ClientCouponValidityPills
            validFrom={coupon.validFrom}
            validUntil={coupon.validUntil}
            locale={locale}
            t={t}
            variant="sheet"
          />
        </View>

        {coupon.description?.trim() ? (
          <ThemedText className="mt-4 whitespace-pre-line text-base leading-6 text-light-text dark:text-dark-text">
            {coupon.description.trim()}
          </ThemedText>
        ) : null}

        <View className="mt-6">
          <PromoCouponCodeRow code={coupon.code} t={t} />
        </View>

        <View className="mt-10">
          <ReserveButton
            title={t('commonReserve')}
            fullWidth
            href="/screens/reservation-create"
          />
        </View>
      </>
    );
  };

  const content =
    data.kind === PROMO_POSTER_SEGMENT
      ? renderPosterContent(data.poster)
      : renderCouponContent(data.coupon);

  const hero = heroUri ? (
    <PromoHeroImage uri={heroUri} width={heroWidth} height={heroHeight} />
  ) : null;

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      {!isMobileHeader ? <Header showBackButton title="" /> : null}

      <ThemeScroller
        ref={scrollRef}
        className="px-0"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false})}
        scrollEventThrottle={16}>
        <View className={isMobileHeader ? 'mt-4 px-global pb-8' : 'p-global pb-8'}>
          <SiteBreadcrumbs items={breadcrumbItems} accessibilityLabel={t('breadcrumbNavLabel')} />

          {isMobileHeader ? (
            <View className="mt-4">
              {hero ? <View className="mb-5">{hero}</View> : null}
              {content}
            </View>
          ) : (
            <View className="mt-4 flex-row items-start gap-6">
              <View className="min-w-0 flex-1">{content}</View>
              {hero ? <View className="shrink-0">{hero}</View> : null}
            </View>
          )}
        </View>
      </ThemeScroller>
    </View>
  );
}
