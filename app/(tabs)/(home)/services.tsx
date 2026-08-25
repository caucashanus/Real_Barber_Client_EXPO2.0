import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Animated, View } from 'react-native';
import { router } from 'expo-router';

import { ScrollContext } from './_layout';

import { fetchPublicServicesPage, type PublicServicesPageResponse } from '@/api/publicServicesPage';
import { useTranslation } from '@/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import CustomCard from '@/components/CustomCard';
import HaircutInspirationCarousel from '@/components/services/HaircutInspirationCarousel';
import ServiceItemGrid from '@/components/services/ServiceItemGrid';
import SlotTimePill from '@/components/SlotTimePill';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import SiteLoadingState from '@/components/SiteLoadingState';
import type { TranslationKey } from '@/locales';
import {
  getHaircutCarouselItems,
  getSupplementaryServiceGridItems,
  mapPublicServiceToGridItem,
  sortMainServices} from '@/utils/publicServicesPageHelpers';

const EMPTY_PAGE: PublicServicesPageResponse = {
  mainServices: [],
  barveniServices: [],
  balickyServices: []};

function ServicesSectionIntroCard({
  t,
  titleKey,
  bodyKey,
  actionTitleKey,
  actionHref}: {
  t: ReturnType<typeof useTranslation>['t'];
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  actionTitleKey?: TranslationKey;
  actionHref?: string;
}) {
  return (
    <View className="mb-6">
      <CustomCard
        rounded="2xl"
        padding="md"
        border
        background={false}>
        <ThemedText className="text-lg font-semibold">{t(titleKey)}</ThemedText>
        <ThemedText className="mt-3 text-sm leading-6 text-light-subtext dark:text-dark-subtext">
          {t(bodyKey)}
        </ThemedText>
        {actionTitleKey && actionHref ? (
          <View className="mt-4 flex-row justify-end">
            <SlotTimePill
              title={t(actionTitleKey)}
              onPress={() => router.push(actionHref)}
            />
          </View>
        ) : null}
      </CustomCard>
    </View>
  );
}

const ServicesScreen = () => {
  const scrollY = useContext(ScrollContext);
  const { t, locale } = useTranslation();
  const [pageData, setPageData] = useState<PublicServicesPageResponse>(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchPublicServicesPage()
      .then(setPageData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const mainGridItems = useMemo(
    () =>
      sortMainServices(pageData.mainServices).map((service) =>
        mapPublicServiceToGridItem(service, locale)
      ),
    [pageData.mainServices, locale]
  );

  const packageGridItems = useMemo(
    () => pageData.balickyServices.map((service) => mapPublicServiceToGridItem(service, locale)),
    [pageData.balickyServices, locale]
  );

  const supplementaryGridItems = useMemo(
    () => getSupplementaryServiceGridItems(pageData.barveniServices, t, locale),
    [pageData.barveniServices, t, locale]
  );

  const haircutCarouselItems = useMemo(() => getHaircutCarouselItems(locale), [locale]);

  return (
    <ThemeScroller
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false})}
      scrollEventThrottle={16}>
      <AnimatedView animation="scaleIn" className="mt-4 flex-1">
        {loading ? (
          <SiteLoadingState layout="section" className="py-16" />
        ) : (
          <>
            {error ? (
              <View className="mb-4 items-center px-6">
                <ThemedText className="text-center text-red-500 dark:text-red-400">{error}</ThemedText>
              </View>
            ) : null}

            <ServicesSectionIntroCard
              t={t}
              titleKey="servicesPageTitle"
              bodyKey="servicesPageRBarberNote"
              actionTitleKey="servicesPageHaircutBook"
              actionHref="/inspirace"
            />

            <Section title={t('servicesPageHairAndBeard')} titleSize="lg">
              {mainGridItems.length === 0 ? (
                <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
                  {t('servicesNoItems')}
                </ThemedText>
              ) : (
                <ServiceItemGrid items={mainGridItems} />
              )}
            </Section>

            {packageGridItems.length > 0 ? (
              <View className="mt-6">
                <ServicesSectionIntroCard
                  t={t}
                  titleKey="servicesPackages"
                  bodyKey="servicesPagePackagesIntro"
                />
                <ServiceItemGrid items={packageGridItems} />
              </View>
            ) : null}

            <View className="mt-6">
              <ServicesSectionIntroCard
                t={t}
                titleKey="servicesPageSupplementary"
                bodyKey="servicesPageSupplementaryIntro"
              />
              {supplementaryGridItems.length === 0 ? (
                <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
                  {t('servicesNoItems')}
                </ThemedText>
              ) : (
                <ServiceItemGrid items={supplementaryGridItems} />
              )}
            </View>

            <Section title={t('servicesPageHaircutInspiration')} titleSize="lg" className="mt-6">
              <HaircutInspirationCarousel items={haircutCarouselItems} />
            </Section>
          </>
        )}
      </AnimatedView>
    </ThemeScroller>
  );
};

export default ServicesScreen;
