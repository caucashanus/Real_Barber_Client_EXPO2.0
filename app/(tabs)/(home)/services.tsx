import Header from '@/components/Header';
import ThemeScroller from '@/components/ThemeScroller';
import React, { useRef, useContext, useEffect, useState } from 'react';
import { View, Animated, ActivityIndicator } from 'react-native';
import Section from '@/components/layout/Section';
import { CardScroller } from '@/components/CardScroller';
import Card from '@/components/Card';
import AnimatedView from '@/components/AnimatedView';
import { ScrollContext } from './_layout';
import { useAuth } from '@/app/contexts/AuthContext';
import { getItemsAll, type Item } from '@/api/items';
import ThemedText from '@/components/ThemedText';

const CATEGORY_HAIRCUTS = 'Účesy';
const CATEGORY_BASIC = 'Základní';
const CATEGORY_SLUZBY = 'Služby';
const CATEGORY_PACKAGES = 'Balíčky';
const CATEGORY_BARVENI = 'Barvení';
const CATEGORY_SLUZBY_DOMU = 'Služby domů';

const ServicesScreen = () => {
  const scrollY = useContext(ScrollContext);
  const { apiToken } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getItemsAll(apiToken, { includeMedia: true, includeEmployees: false, limit: 50 })
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken]);

  const haircuts = items.filter((i) => i.category === CATEGORY_HAIRCUTS);
  const basic = items.filter((i) => i.category === CATEGORY_BASIC || i.category === CATEGORY_SLUZBY);
  const packages = items.filter((i) => i.category === CATEGORY_PACKAGES);
  const coloring = items.filter((i) => i.category === CATEGORY_BARVENI);
  const homeServices = items.filter((i) => i.category === CATEGORY_SLUZBY_DOMU);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
        <ActivityIndicator size="large" />
        <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">Loading…</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary p-6">
        <ThemedText className="text-center text-red-500 dark:text-red-400">{error}</ThemedText>
      </View>
    );
  }

  return (
    <ThemeScroller
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}
    >
      <AnimatedView animation="scaleIn" className="flex-1 mt-4">
        <Section title="Haircuts" titleSize="lg">
          <CardScroller space={15} className="mt-1.5 pb-4">
            {haircuts.length === 0 ? (
              <ThemedText className="text-light-subtext dark:text-dark-subtext py-4">No items</ThemedText>
            ) : (
              haircuts.map((item) => (
                <Card
                  key={item.id}
                  title={item.name}
                  rounded="2xl"
                  description={`${haircuts.length} available`}
                  width={100}
                  imageHeight={100}
                  image={item.imageUrl || require('@/assets/img/room-1.avif')}
                  href={`/screens/service-detail?id=${item.id}`}
                />
              ))
            )}
          </CardScroller>
        </Section>

        <Section title="Basic" titleSize="lg" link="/screens/map" linkText="View all">
          <CardScroller space={15} className="mt-1.5 pb-4">
            {basic.length === 0 ? (
              <ThemedText className="text-light-subtext dark:text-dark-subtext py-4">No items</ThemedText>
            ) : (
              basic.map((item) => (
                <Card
                  key={item.id}
                  title={item.name}
                  rounded="2xl"
                  hasFavorite
                  favoriteEntityType="item"
                  favoriteEntityId={item.id}
                  width={160}
                  imageHeight={160}
                  image={item.imageUrl || require('@/assets/img/room-1.avif')}
                  href={`/screens/service-detail?id=${item.id}`}
                />
              ))
            )}
          </CardScroller>
        </Section>

        <Section title="Packages" titleSize="lg" link="/screens/map" linkText="View all">
          <CardScroller space={15} className="mt-1.5 pb-4">
            {packages.length === 0 ? (
              <ThemedText className="text-light-subtext dark:text-dark-subtext py-4">No items</ThemedText>
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
                  image={item.imageUrl || require('@/assets/img/room-1.avif')}
                  href={`/screens/service-detail?id=${item.id}`}
                />
              ))
            )}
          </CardScroller>
        </Section>

        <Section title="Coloring" titleSize="lg" link="/screens/map" linkText="View all">
          <CardScroller space={15} className="mt-1.5 pb-4">
            {coloring.length === 0 ? (
              <ThemedText className="text-light-subtext dark:text-dark-subtext py-4">No items</ThemedText>
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
                  image={item.imageUrl || require('@/assets/img/room-1.avif')}
                  href={`/screens/service-detail?id=${item.id}`}
                />
              ))
            )}
          </CardScroller>
        </Section>

        <Section title="Home services" titleSize="lg" link="/screens/map" linkText="View all">
          <CardScroller space={15} className="mt-1.5 pb-4">
            {homeServices.length === 0 ? (
              <ThemedText className="text-light-subtext dark:text-dark-subtext py-4">No items</ThemedText>
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
                  image={item.imageUrl || require('@/assets/img/room-1.avif')}
                  href={`/screens/service-detail?id=${item.id}`}
                />
              ))
            )}
          </CardScroller>
        </Section>
      </AnimatedView>
    </ThemeScroller>
  );
};

export default ServicesScreen;
