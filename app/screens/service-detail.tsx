import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Image,
  ActivityIndicator,
  Animated,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getItemsAll, type Item } from '@/api/items';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Button } from '@/components/Button';
import Favorite from '@/components/Favorite';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { Chip } from '@/components/Chip';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';

function itemImages(item: Item): (string | number)[] {
  const out: (string | number)[] = [];
  if (item.imageUrl) out.push(item.imageUrl);
  const media = item.media;
  if (media && Array.isArray(media)) {
    media.forEach((m: { url?: string }) => {
      if (m?.url) out.push(m.url);
    });
  }
  if (out.length === 0) out.push(require('@/assets/img/barbers.png'));
  return out;
}

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiToken } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const heroScrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!apiToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getItemsAll(apiToken, { includeMedia: true, includeEmployees: false, limit: 50 })
      .then((all) => {
        const found = all.find((i) => i.id === id) ?? null;
        setItem(found);
        if (!found) setError('Service not found');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken, id]);

  if (loading) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
          <ActivityIndicator size="large" />
          <ThemedText className="mt-4 text-light-subtext dark:text-dark-subtext">
            {t('commonLoading')}
          </ThemedText>
        </View>
      </>
    );
  }

  if (error || !item) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary p-6 dark:bg-dark-primary">
          <ThemedText className="text-center text-red-500 dark:text-red-400">
            {error ?? 'Service not found'}
          </ThemedText>
        </View>
      </>
    );
  }

  const images = itemImages(item);
  const rightComponents = item.name
    ? [
        <Favorite
          key="fav"
          productName={item.name}
          title={item.name}
          entityType="item"
          entityId={item.id}
          size={25}
        />,
      ]
    : undefined;

  return (
    <>
      <Header title="" rightComponents={rightComponents} showBackButton />
      <ThemedScroller
        className="bg-light-primary px-0 dark:bg-dark-primary"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: heroScrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}>
        <Animated.View
          className="overflow-hidden bg-light-secondary dark:bg-dark-secondary"
          style={{
            transform: [
              {
                scale: heroScrollY.interpolate({
                  inputRange: [-160, 0],
                  outputRange: [1.18, 1],
                  extrapolate: 'clamp',
                }),
              },
              {
                translateY: heroScrollY.interpolate({
                  inputRange: [-160, 0],
                  outputRange: [-20, 0],
                  extrapolate: 'clamp',
                }),
              },
            ],
          }}>
          <Image
            source={typeof images[0] === 'string' ? { uri: images[0] } : images[0]}
            className="w-full"
            style={{ aspectRatio: 4 / 3 }}
            resizeMode="cover"
          />
        </Animated.View>

        <View className="p-global">
          <ThemedText className="text-2xl font-bold">{item.name}</ThemedText>

          {item.category ? (
            <View className="mt-3">
              <Chip label={item.category} size="md" className="self-start" />
            </View>
          ) : null}

          <Divider className="my-6" />

          {item.description ? (
            <Section title={t('serviceAbout')} titleSize="lg" className="mb-6">
              <ThemedText className="mt-2 leading-6 text-light-subtext dark:text-dark-subtext">
                {item.description}
              </ThemedText>
            </Section>
          ) : (
            <Section title={t('serviceAbout')} titleSize="lg" className="mb-6">
              <ThemedText className="mt-2 italic text-light-subtext dark:text-dark-subtext">
                No description available.
              </ThemedText>
            </Section>
          )}

          <Divider className="my-4" />
        </View>
      </ThemedScroller>

      <View
        style={{ paddingBottom: insets.bottom }}
        className="flex-row items-center justify-start border-t border-neutral-200 bg-light-primary px-global pt-4 dark:border-dark-secondary dark:bg-dark-primary">
        <View>
          <ThemedText className="text-xl font-bold">{t('serviceBookThisService')}</ThemedText>
          <ThemedText className="text-xs opacity-60">{t('serviceChooseBranchBarber')}</ThemedText>
        </View>
        <View className="ml-auto flex-row items-center">
          <Button
            title={t('commonReserve')}
            variant="primary"
            className="ml-6 px-6"
            size="medium"
            rounded="lg"
            href={`/screens/reservation-create?itemId=${encodeURIComponent(item.id)}&itemName=${encodeURIComponent(item.name ?? '')}`}
          />
        </View>
      </View>
    </>
  );
}
