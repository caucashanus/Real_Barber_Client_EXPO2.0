import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Animated, View } from 'react-native';

import { ScrollContext } from './_layout';

import { fetchPublicServicesPage, type PublicServicesPageResponse } from '@/api/publicServicesPage';
import { useTranslation } from '@/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import HaircutInspirationCarousel from '@/components/services/HaircutInspirationCarousel';
import ServiceItemGrid from '@/components/services/ServiceItemGrid';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import SectionIntroCard from '@/components/layout/SectionIntroCard';
import SiteLoadingState from '@/components/SiteLoadingState';
import {
  getHaircutCarouselItems,
  getSupplementaryServiceGridItems,
  mapPublicServiceToGridItem,
  sortMainServices} from '@/utils/publicServicesPageHelpers';

const EMPTY_PAGE: PublicServicesPageResponse = {
  mainServices: [],
  barveniServices: [],
  balickyServices: []};

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

            <SectionIntroCard
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
                <SectionIntroCard
                  t={t}
                  titleKey="servicesPackages"
                  bodyKey="servicesPagePackagesIntro"
                />
                <ServiceItemGrid items={packageGridItems} />
              </View>
            ) : null}

            <View className="mt-6">
              <SectionIntroCard
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
