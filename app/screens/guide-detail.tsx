import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Image, ScrollView, ActivityIndicator, Dimensions, Pressable } from 'react-native';

import {
  getCachedGuide,
  getCachedGuidesList,
  type ClientGuide,
  type GuideMedia,
} from '@/api/guides';
import Favorite from '@/components/Favorite';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import VideoPlayer from '@/components/VideoPlayer';

const screenWidth = Dimensions.get('window').width;

function formatAddedAt(iso: string): string {
  const d = new Date(iso);
  return `přidáno ${d.getDate()}.${d.getMonth() + 1} ${d.getFullYear()}`;
}

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const h = d.getHours();
  const m = d.getMinutes();
  return `${day}. ${month}. ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function MediaItem({ item }: { item: GuideMedia }) {
  const file = item.mediaFile;
  if (!file?.url) return null;

  if (file.fileType === 'image') {
    return (
      <View className="mr-3 overflow-hidden rounded-xl bg-light-secondary dark:bg-dark-secondary">
        <Image
          source={{ uri: file.url }}
          style={{ width: screenWidth * 0.6, height: 220 }}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (file.fileType === 'video') {
    return (
      <View className="mr-3 overflow-hidden rounded-xl bg-black">
        <VideoPlayer
          uri={file.url}
          style={{ width: screenWidth * 0.6, height: 220 }}
          contentFit="contain"
          nativeControls
        />
      </View>
    );
  }

  if (file.fileType === 'document') {
    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/screens/in-app-web',
            params: { url: encodeURIComponent(file.url) },
          })
        }
        className="mr-3 flex-row items-center justify-center rounded-xl bg-light-secondary p-4 dark:bg-dark-secondary"
        style={{ width: screenWidth * 0.6, minHeight: 80 }}>
        <Icon
          name="FileText"
          size={28}
          className="mr-3 text-light-subtext dark:text-dark-subtext"
        />
        <ThemedText className="text-sm font-medium">Otevřít</ThemedText>
      </Pressable>
    );
  }

  return null;
}

export default function GuideDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [guide, setGuide] = useState<ClientGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('Missing guide');
      return;
    }
    setLoading(true);
    setError(null);
    const cached = getCachedGuide(id);
    if (cached) {
      setGuide(cached);
      setError(null);
    } else {
      setError('Guide not found. Open it from the Guides list.');
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <>
        <Header title="" showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
          <ActivityIndicator size="large" />
          <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">
            Loading…
          </ThemedText>
        </View>
      </>
    );
  }

  if (error || !guide) {
    return (
      <>
        <Header title="" showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary p-6 dark:bg-dark-primary">
          <ThemedText className="text-center text-red-500 dark:text-red-400">
            {error || 'Guide not found'}
          </ThemedText>
        </View>
      </>
    );
  }

  const hasMedia = guide.media && guide.media.length > 0;
  const list = getCachedGuidesList();
  const currentIndex = list.findIndex((g) => g.id === guide.id);
  const prevGuide = currentIndex > 0 ? list[currentIndex - 1] : null;
  const nextGuide =
    currentIndex >= 0 && currentIndex < list.length - 1 ? list[currentIndex + 1] : null;

  const goToPrev = () =>
    prevGuide &&
    router.replace({ pathname: '/screens/guide-detail', params: { id: prevGuide.id } });
  const goToNext = () =>
    nextGuide &&
    router.replace({ pathname: '/screens/guide-detail', params: { id: nextGuide.id } });

  return (
    <>
      <Header
        title=""
        showBackButton
        rightComponents={[
          <Favorite
            key="fav"
            entityType="guide"
            entityId={guide.id}
            title={guide.title}
            size={25}
          />,
        ]}
      />
      <ThemedScroller className="flex-1 px-0" keyboardShouldPersistTaps="handled">
        <View className="mb-6 mt-0 px-global">
          <View className="mb-4 flex-row justify-end">
            <Pressable
              onPress={goToPrev}
              className={`mr-2 h-10 w-10 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-600 ${
                prevGuide ? 'opacity-100' : 'opacity-30'
              }`}
              disabled={!prevGuide}>
              <Icon name="ChevronLeft" size={24} className="-translate-x-px" />
            </Pressable>
            <Pressable
              onPress={goToNext}
              className={`h-10 w-10 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-600 ${
                nextGuide ? 'opacity-100' : 'opacity-30'
              }`}
              disabled={!nextGuide}>
              <Icon name="ChevronRight" size={24} className="translate-x-px" />
            </Pressable>
          </View>
          <ThemedText className="text-4xl font-semibold" numberOfLines={5}>
            {guide.title}
          </ThemedText>
          <ThemedText className="mt-2 text-lg text-light-subtext dark:text-dark-subtext">
            {formatAddedAt(guide.createdAt)}
          </ThemedText>
        </View>

        {hasMedia ? (
          <View className="mb-6">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}>
              {[...guide.media]
                .sort((a, b) => a.order - b.order)
                .map((item) => (
                  <MediaItem key={item.id} item={item} />
                ))}
            </ScrollView>
          </View>
        ) : null}

        <View className="border-t-8 border-light-secondary px-global pt-global dark:border-dark-secondary">
          <ThemedText className="mb-4 text-2xl font-semibold">Popis</ThemedText>
          <ThemedText className="text-base text-light-text dark:text-dark-text">
            {guide.content || '—'}
          </ThemedText>

          <View className="mt-6 flex-row items-center justify-between border-t border-light-secondary py-3 dark:border-dark-secondary">
            <ThemedText className="text-base opacity-50">Aktualizováno</ThemedText>
            <ThemedText className="text-lg">{formatUpdatedAt(guide.updatedAt)}</ThemedText>
          </View>
          <View className="flex-row items-center justify-center py-6">
            <Pressable
              onPress={goToPrev}
              className={`mr-2 h-10 w-10 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-600 ${
                prevGuide ? 'opacity-100' : 'opacity-30'
              }`}
              disabled={!prevGuide}>
              <Icon name="ChevronLeft" size={24} className="-translate-x-px" />
            </Pressable>
            <Pressable
              onPress={goToNext}
              className={`h-10 w-10 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-600 ${
                nextGuide ? 'opacity-100' : 'opacity-30'
              }`}
              disabled={!nextGuide}>
              <Icon name="ChevronRight" size={24} className="translate-x-px" />
            </Pressable>
          </View>
        </View>
      </ThemedScroller>
    </>
  );
}
