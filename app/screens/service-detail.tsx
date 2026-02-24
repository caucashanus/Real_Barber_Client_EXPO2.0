import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import Section from '@/components/layout/Section';
import Divider from '@/components/layout/Divider';
import { Button } from '@/components/Button';
import Favorite from '@/components/Favorite';
import { Chip } from '@/components/Chip';
import { useAuth } from '@/app/contexts/AuthContext';
import { getItemsAll, type Item } from '@/api/items';

function itemImages(item: Item): (string | number)[] {
  const out: (string | number)[] = [];
  if (item.imageUrl) out.push(item.imageUrl);
  const media = item.media;
  if (media && Array.isArray(media)) {
    media.forEach((m: { url?: string }) => { if (m?.url) out.push(m.url); });
  }
  if (out.length === 0) out.push(require('@/assets/img/room-1.avif'));
  return out;
}

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiToken } = useAuth();
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <ThemedText className="mt-4 text-light-subtext dark:text-dark-subtext">Loading…</ThemedText>
        </View>
      </>
    );
  }

  if (error || !item) {
    return (
      <>
        <Header showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary p-6">
          <ThemedText className="text-center text-red-500 dark:text-red-400">{error ?? 'Service not found'}</ThemedText>
        </View>
      </>
    );
  }

  const images = itemImages(item);
  const rightComponents = item.name ? [<Favorite key="fav" productName={item.name} size={25} />] : undefined;

  return (
    <>
      <Header title="" rightComponents={rightComponents} showBackButton />
      <ThemedScroller className="px-0 bg-light-primary dark:bg-dark-primary">
        <View className="bg-light-secondary dark:bg-dark-secondary">
          <Image
            source={typeof images[0] === 'string' ? { uri: images[0] } : images[0]}
            className="w-full"
            style={{ aspectRatio: 4 / 3 }}
            resizeMode="cover"
          />
        </View>

        <View className="p-global">
          <ThemedText className="text-2xl font-bold">{item.name}</ThemedText>
          {item.category ? (
            <View className="mt-3">
              <Chip label={item.category} size="md" className="self-start" />
            </View>
          ) : null}

          <Divider className="my-6" />

          {item.description ? (
            <Section title="About this service" titleSize="lg" className="mb-6">
              <ThemedText className="text-light-subtext dark:text-dark-subtext leading-6 mt-2">
                {item.description}
              </ThemedText>
            </Section>
          ) : (
            <Section title="About this service" titleSize="lg" className="mb-6">
              <ThemedText className="text-light-subtext dark:text-dark-subtext italic mt-2">
                No description available.
              </ThemedText>
            </Section>
          )}

          <Divider className="my-4" />
        </View>
      </ThemedScroller>

      <View
        style={{ paddingBottom: insets.bottom }}
        className="flex-row items-center justify-start px-global pt-4 border-t border-neutral-200 dark:border-dark-secondary bg-light-primary dark:bg-dark-primary"
      >
        <View>
          <ThemedText className="text-xl font-bold">Book this service</ThemedText>
          <ThemedText className="text-xs opacity-60">Choose branch and barber</ThemedText>
        </View>
        <View className="flex-row items-center ml-auto">
          <Button
            title="Reserve"
            className="bg-highlight ml-6 px-6"
            textClassName="text-white"
            size="medium"
            rounded="lg"
            href={`/screens/checkout?itemId=${item.id}`}
          />
        </View>
      </View>
    </>
  );
}
