import ThemeScroller from '@/components/ThemeScroller';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { View, Pressable, Image, Animated, ActivityIndicator } from 'react-native';
import AnimatedView from '@/components/AnimatedView';
import { ScrollContext } from './_layout';
import ThemedText from '@/components/ThemedText';
import { router } from 'expo-router';
import { shadowPresets } from '@/utils/useShadow';
import { getClientGuides, type ClientGuide } from '@/api/guides';
import { useFocusEffect } from '@react-navigation/native';

function formatAddedAt(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `přidáno ${day}.${month} ${year}`;
}

function getFirstImageUrl(guide: ClientGuide): string | null {
  const images = (guide.media || [])
    .filter((m) => m.mediaFile?.fileType === 'image' && m.mediaFile?.url)
    .sort((a, b) => a.order - b.order);
  return images.length > 0 ? images[0].mediaFile!.url : null;
}

function GuideCard({ guide }: { guide: ClientGuide }) {
  const imageUrl = getFirstImageUrl(guide);
  const onPress = () => router.push({ pathname: '/screens/guide-detail', params: { id: guide.id } });

  return (
    <Pressable
      onPress={onPress}
      style={{ ...shadowPresets.large }}
      className="p-5 mb-8 flex flex-row items-center rounded-2xl bg-light-primary dark:bg-dark-secondary"
    >
      <View className="flex-1 pr-3">
        <ThemedText className="text-base font-medium" numberOfLines={2}>
          {guide.title}
        </ThemedText>
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-1">
          {formatAddedAt(guide.createdAt)}
        </ThemedText>
      </View>
      <View className="w-20 h-20">
        {imageUrl ? (
          <View className="w-full h-full rounded-xl overflow-hidden border-2 border-light-primary dark:border-dark-primary">
            <Image className="w-full h-full" source={{ uri: imageUrl }} resizeMode="cover" />
          </View>
        ) : (
          <View className="w-full h-full rounded-xl bg-light-secondary dark:bg-dark-secondary border-2 border-light-primary dark:border-dark-primary items-center justify-center">
            <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">—</ThemedText>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const GuidesScreen = () => {
  const scrollY = useContext(ScrollContext);
  const [guides, setGuides] = useState<ClientGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getClientGuides()
      .then(setGuides)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ThemeScroller
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}
    >
      <AnimatedView animation="scaleIn" className="flex-1 mt-4">
        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" />
            <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">Loading guides…</ThemedText>
          </View>
        ) : error ? (
          <View className="py-12 px-4 items-center">
            <ThemedText className="text-center text-light-subtext dark:text-dark-subtext mb-4">{error}</ThemedText>
          </View>
        ) : guides.length === 0 ? (
          <View className="py-12 px-4 items-center">
            <ThemedText className="text-center text-light-subtext dark:text-dark-subtext">No guides yet.</ThemedText>
          </View>
        ) : (
          guides.map((guide) => <GuideCard key={guide.id} guide={guide} />)
        )}
      </AnimatedView>
    </ThemeScroller>
  );
};

export default GuidesScreen;
