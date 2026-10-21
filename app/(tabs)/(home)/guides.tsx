import { useFocusEffect } from "expo-router/react-navigation";
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';

import { getClientGuides, type ClientGuide } from '@/api/guides';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHomeTabScrollSync } from '@/hooks/useHomeTabScrollSync';
import { useTranslation } from '@/hooks/useTranslation';
import { toGuideLocale } from '@/utils/guides/guideLocale';
import Favorite from '@/components/Favorite';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import SurfaceCard from '@/components/layout/SurfaceCard';
import SiteLoadingSpinner from '@/components/SiteLoadingSpinner';

function formatAddedAt(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `přidáno ${day}.${month} ${year}`;
}

function getFirstImageUrl(guide: ClientGuide): string | null {
  if (guide.heroImageUrl?.trim()) return guide.heroImageUrl.trim();
  const images = (guide.media || [])
    .filter((m) => m.mediaFile?.fileType === 'image' && m.mediaFile?.url)
    .sort((a, b) => a.order - b.order);
  return images.length > 0 ? images[0].mediaFile!.url : null;
}

function GuideCard({ guide }: { guide: ClientGuide }) {
  const imageUrl = getFirstImageUrl(guide);
  const onPress = () =>
    router.push({ pathname: '/screens/guide-detail', params: { id: String(guide.id) } });

  return (
    <Pressable onPress={onPress} className="mb-8">
      <SurfaceCard rounded="2xl" className="flex flex-row items-center p-5">
      <View className="flex-1 pr-3">
        <ThemedText className="text-base font-medium" numberOfLines={2}>
          {guide.title}
        </ThemedText>
        <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
          {formatAddedAt(guide.createdAt)}
        </ThemedText>
      </View>
      <View className="relative h-20 w-20">
        {imageUrl ? (
          <View className="h-full w-full overflow-hidden rounded-xl border-2 border-light-primary dark:border-dark-primary">
            <Image className="h-full w-full" source={{ uri: imageUrl }} contentFit="cover" />
          </View>
        ) : (
          <View className="h-full w-full items-center justify-center rounded-xl border-2 border-light-primary bg-light-surface dark:border-dark-primary dark:bg-dark-secondary">
            <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">—</ThemedText>
          </View>
        )}
        <View className="absolute right-1 top-1 z-10">
          <Favorite entityType="guide" entityId={guide.id} title={guide.title} size={20} isWhite />
        </View>
      </View>
      </SurfaceCard>
    </Pressable>
  );
}

const GuidesScreen = () => {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const guideLocale = toGuideLocale(locale);
  const { scrollRef, onScroll, scrollEventThrottle, animatedScroll } = useHomeTabScrollSync();
  const [guides, setGuides] = useState<ClientGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
        setError(null);
      }
      getClientGuides(guideLocale)
        .then(setGuides)
        .catch((e) => {
          if (!options?.silent) {
            setError(e instanceof Error ? e.message : 'Failed to load');
          }
        })
        .finally(() => {
          if (!options?.silent) setLoading(false);
        });
    },
    [guideLocale]
  );

  useFocusEffect(
    useCallback(() => {
      load({ silent: guides.length > 0 });
    }, [load, guides.length])
  );

  return (
    <ThemeScroller
      ref={scrollRef}
      animatedScroll={animatedScroll}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}>
      <View className="mt-4 flex-1">
        {loading ? (
          <View className="items-center py-12">
            <SiteLoadingSpinner />
            <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">
              {t('guidesLoading')}
            </ThemedText>
          </View>
        ) : error ? (
          <View className="items-center px-4 py-12">
            <ThemedText className="mb-4 text-center text-light-subtext dark:text-dark-subtext">
              {error}
            </ThemedText>
          </View>
        ) : guides.length === 0 ? (
          <View className="items-center px-4 py-12">
            <ThemedText className="text-center text-light-subtext dark:text-dark-subtext">
              {t('guidesNoGuides')}
            </ThemedText>
          </View>
        ) : (
          guides.map((guide) => <GuideCard key={guide.id} guide={guide} />)
        )}
      </View>
    </ThemeScroller>
  );
};

export default GuidesScreen;
