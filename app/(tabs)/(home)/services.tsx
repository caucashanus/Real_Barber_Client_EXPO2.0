import React, { useContext, useEffect, useState, useMemo } from 'react';
import { View, Animated } from 'react-native';

import { ScrollContext } from './_layout';

import { getItemsAll, itemListImageUrl, type Item } from '@/api/items';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import Card from '@/components/Card';
import { CardScroller } from '@/components/CardScroller';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';

const CATEGORY_HAIRCUTS = 'Účesy';
const CATEGORY_BASIC = 'Základní';
const CATEGORY_SLUZBY = 'Služby';
const CATEGORY_PACKAGES = 'Balíčky';
const CATEGORY_BARVENI = 'Barvení';
const CATEGORY_SLUZBY_DOMU = 'Služby domů';

/** Pořadí karet v sekci Základní / Služby (názvy musí přesně odpovídat CRM). */
const BASIC_SECTION_ITEM_ORDER = [
  'Vlasy a Vousy',
  'Vlasy',
  'Vousy',
  'Rychlé stříhání',
  'Vlasy do 12 let',
] as const;

function sortItemsByNameOrder(items: Item[], orderedNames: readonly string[]): Item[] {
  const rank = new Map(orderedNames.map((name, i) => [name, i]));
  const tail = orderedNames.length;
  return [...items].sort((a, b) => {
    const ra = rank.has(a.name) ? rank.get(a.name)! : tail;
    const rb = rank.has(b.name) ? rank.get(b.name)! : tail;
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name, 'cs');
  });
}

function serviceCardImage(item: Item): string | number {
  return itemListImageUrl(item) || require('@/assets/img/barbers.png');
}

const ServicesScreen = () => {
  const scrollY = useContext(ScrollContext);
  const { apiToken } = useAuth();
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiToken) return;
    setError(null);
    getItemsAll(apiToken)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [apiToken]);

  const haircuts = items.filter((i) => i.category === CATEGORY_HAIRCUTS);
  const basicOrdered = useMemo(() => {
    const filtered = items.filter(
      (i) => i.category === CATEGORY_BASIC || i.category === CATEGORY_SLUZBY
    );
    return sortItemsByNameOrder(filtered, BASIC_SECTION_ITEM_ORDER);
  }, [items]);
  const packages = items.filter((i) => i.category === CATEGORY_PACKAGES);
  const coloring = items.filter((i) => i.category === CATEGORY_BARVENI);
  const homeServices = items.filter((i) => i.category === CATEGORY_SLUZBY_DOMU);

  return (
    <ThemeScroller
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
      })}
      scrollEventThrottle={16}>
      <View className="mt-4 flex-1">
        {error ? (
          <View className="items-center px-6 py-4">
            <ThemedText className="text-center text-red-500 dark:text-red-400">{error}</ThemedText>
          </View>
        ) : null}
        <Section title={t('servicesHaircuts')} titleSize="lg">
          <CardScroller space={15} className="mt-1.5 pb-4">
            {haircuts.length === 0 ? (
              <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
                {t('servicesNoItems')}
              </ThemedText>
            ) : (
              haircuts.map((item) => (
                <Card
                  key={item.id}
                  title={item.name}
                  rounded="2xl"
                  hasFavorite
                  favoriteEntityType="item"
                  favoriteEntityId={item.id}
                  width={100}
                  imageHeight={100}
                  image={serviceCardImage(item)}
                  href={`/screens/service-detail?id=${item.id}`}
                />
              ))
            )}
          </CardScroller>
        </Section>

        <Section
          title={t('servicesBasic')}
          titleSize="lg"
          link="/screens/map"
          linkText={t('commonViewAll')}>
          <CardScroller space={15} className="mt-1.5 pb-4">
            {basicOrdered.length === 0 ? (
              <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
                {t('servicesNoItems')}
              </ThemedText>
            ) : (
              basicOrdered.map((item) => (
                <Card
                  key={item.id}
                  title={item.name}
                  rounded="2xl"
                  hasFavorite
                  favoriteEntityType="item"
                  favoriteEntityId={item.id}
                  width={160}
                  imageHeight={160}
                  image={serviceCardImage(item)}
                  href={`/screens/service-detail?id=${item.id}`}
                />
              ))
            )}
          </CardScroller>
        </Section>

        <Section
          title={t('servicesPackages')}
          titleSize="lg"
          link="/screens/map"
          linkText={t('commonViewAll')}>
          <CardScroller space={15} className="mt-1.5 pb-4">
            {packages.length === 0 ? (
              <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
                {t('servicesNoItems')}
              </ThemedText>
            ) : (
              packages.map((item) => (
                <Card
                  key={item.id}
                  title={item.name}
                  rounded="2xl"
                  hasFavorite
                  favoriteEntityType="item"
                  favoriteEntityId={item.id}
                  width={160}
                  imageHeight={160}
                  image={serviceCardImage(item)}
                  href={`/screens/service-detail?id=${item.id}`}
                />
              ))
            )}
          </CardScroller>
        </Section>

        <Section
          title={t('servicesColoring')}
          titleSize="lg"
          link="/screens/map"
          linkText={t('commonViewAll')}>
          <CardScroller space={15} className="mt-1.5 pb-4">
            {coloring.length === 0 ? (
              <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
                {t('servicesNoItems')}
              </ThemedText>
            ) : (
              coloring.map((item) => (
                <Card
                  key={item.id}
                  title={item.name}
                  rounded="2xl"
                  hasFavorite
                  favoriteEntityType="item"
                  favoriteEntityId={item.id}
                  width={160}
                  imageHeight={160}
                  image={serviceCardImage(item)}
                  href={`/screens/service-detail?id=${item.id}`}
                />
              ))
            )}
          </CardScroller>
        </Section>

        <Section
          title={t('servicesHomeServices')}
          titleSize="lg"
          link="/screens/map"
          linkText={t('commonViewAll')}>
          <CardScroller space={15} className="mt-1.5 pb-4">
            {homeServices.length === 0 ? (
              <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
                {t('servicesNoItems')}
              </ThemedText>
            ) : (
              homeServices.map((item) => (
                <Card
                  key={item.id}
                  title={item.name}
                  rounded="2xl"
                  hasFavorite
                  favoriteEntityType="item"
                  favoriteEntityId={item.id}
                  width={160}
                  imageHeight={160}
                  image={serviceCardImage(item)}
                  href={`/screens/service-detail?id=${item.id}`}
                />
              ))
            )}
          </CardScroller>
        </Section>
      </View>
    </ThemeScroller>
  );
};

export default ServicesScreen;
