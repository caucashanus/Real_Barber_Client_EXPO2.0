import { router } from 'expo-router';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Animated, Image, Pressable, View } from 'react-native';

import { ScrollContext } from './_layout';

import { getBranches, type Branch, type BranchService } from '@/api/branches';
import { getClientReviewsList, type ClientReviewListItem } from '@/api/reviews';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import Card from '@/components/Card';
import { CardScroller } from '@/components/CardScroller';
import Icon from '@/components/Icon';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import VideoPlayer from '@/components/VideoPlayer';
import Section from '@/components/layout/Section';
import { shadowPresets } from '@/utils/useShadow';

function getServicesList(branch: Branch): BranchService[] {
  const s = branch.services;
  if (!s) return [];
  if (Array.isArray(s)) return s;
  return Object.values(s);
}

function getMediaUrlsSorted(media: Branch['media']): string[] {
  if (!media) return [];
  const list = Array.isArray(media) ? [...media] : Object.values(media);
  const withOrder = list.filter((m): m is { url: string; order?: number } => !!m?.url);
  withOrder.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return withOrder.map((m) => m.url);
}

/** First video URL from branch.media for "Kudy k nám" (type === 'video'). */
function getKudyVideoUrl(branch: Branch): string | null {
  const media = branch.media;
  if (!media) return null;
  const list = Array.isArray(media) ? [...media] : Object.values(media);
  const videos = list.filter(
    (m): m is { url: string; order?: number; type?: string } =>
      !!m?.url && (m as { type?: string }).type === 'video'
  );
  if (videos.length === 0) return null;
  videos.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return videos[0].url;
}

function branchCardImage(branch: Branch): string | number {
  const mediaUrls = getMediaUrlsSorted(branch.media);
  if (mediaUrls.length > 0) return mediaUrls[0];
  if (branch.imageUrl) return branch.imageUrl;
  const servicesList = getServicesList(branch);
  const firstService = servicesList[0];
  if (firstService?.imageUrl) return firstService.imageUrl;
  return require('@/assets/img/barbers.png');
}

function branchPrice(branch: Branch): string {
  const servicesList = getServicesList(branch);
  const prices = servicesList.map((s) => s.price).filter((p) => p != null);
  if (prices.length === 0) return '';
  const min = Math.min(...prices);
  return `from ${min} Kč`;
}

function computeBranchRatingsMap(reviews: ClientReviewListItem[]): Map<string, number> {
  const byBranch = new Map<string, number[]>();
  for (const r of reviews) {
    if (r.entityType !== 'branch' || !r.entityId) continue;
    const id = r.entityId;
    if (!byBranch.has(id)) byBranch.set(id, []);
    byBranch.get(id)!.push(Number(r.rating) || 0);
  }
  const out = new Map<string, number>();
  byBranch.forEach((ratings, branchId) => {
    if (ratings.length === 0) return;
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    out.set(branchId, Math.round(avg * 10) / 10);
  });
  return out;
}

export default function BranchesScreen() {
  const scrollY = useContext(ScrollContext);
  const { apiToken } = useAuth();
  const { t } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchReviewsList, setBranchReviewsList] = useState<ClientReviewListItem[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiToken) return;
    setBranchesLoading(true);
    setBranchesError(null);
    Promise.all([
      getBranches(apiToken),
      getClientReviewsList(apiToken, { entityType: 'branch', limit: 500 }),
    ])
      .then(([branchList, reviewsData]) => {
        setBranches(Array.isArray(branchList) ? branchList : []);
        setBranchReviewsList(reviewsData.reviews || []);
      })
      .catch((e) => {
        setBranchesError(e instanceof Error ? e.message : 'Failed to load');
        setBranchReviewsList([]);
      })
      .finally(() => setBranchesLoading(false));
  }, [apiToken]);

  const branchRatingsMap = useMemo(
    () => computeBranchRatingsMap(branchReviewsList),
    [branchReviewsList]
  );
  const popularBranches = branches.length > 0 ? branches : null;

  return (
    <ThemeScroller
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
      })}
      scrollEventThrottle={16}>
      <AnimatedView animation="scaleIn" className="mt-4 flex-1">
        <Pressable
          onPress={() => router.push('/screens/map')}
          style={{ ...shadowPresets.large }}
          className="mb-8 flex flex-row items-center rounded-2xl bg-light-primary p-5 dark:bg-dark-secondary">
          <ThemedText className="flex-1 pr-2 text-base font-medium">
            {t('homeContinueSearchBarbershops')}
          </ThemedText>
          <View className="h-20 w-20 items-center justify-center">
            <Image
              className="h-full w-full"
              source={require('@/assets/img/branches.png')}
              resizeMode="contain"
            />
          </View>
        </Pressable>
        <Section
          title={t('popularBarbershops')}
          titleSize="lg"
          link="/screens/map"
          linkText={t('commonViewAll')}>
          <CardScroller space={15} className="mt-1.5 pb-4">
            {branchesLoading && (
              <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
                {t('commonLoading')}
              </ThemedText>
            )}
            {branchesError && (
              <ThemedText className="py-4 text-red-500 dark:text-red-400">
                {branchesError}
              </ThemedText>
            )}
            {popularBranches?.map((branch) => (
              <Card
                key={branch.id}
                title={branch.name}
                rounded="2xl"
                hasFavorite
                favoriteEntityType="branch"
                favoriteEntityId={branch.id}
                rating={branchRatingsMap.get(branch.id)}
                href={`/screens/branch-detail?id=${branch.id}`}
                price={branchPrice(branch)}
                width={160}
                imageHeight={160}
                image={branchCardImage(branch)}
              />
            ))}
          </CardScroller>
        </Section>

        <Section title={t('howToGetToUs')} titleSize="lg">
          <CardScroller space={15} className="mt-1.5 pb-4">
            {branchesLoading && (
              <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
                {t('commonLoading')}
              </ThemedText>
            )}
            {!branchesLoading &&
              popularBranches?.map((branch) => {
                const kudyVideoUrl = getKudyVideoUrl(branch);
                const cardImage = branchCardImage(branch);
                return (
                  <Pressable
                    key={branch.id}
                    onPress={() =>
                      router.push(`/screens/kudy-k-nam-detail?id=${encodeURIComponent(branch.id)}`)
                    }
                    style={{ width: 160 }}
                    className="active:opacity-80">
                    <View
                      className="relative overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-secondary"
                      style={{ width: 160, height: 160 }}>
                      {kudyVideoUrl != null ? (
                        <>
                          <VideoPlayer
                            uri={kudyVideoUrl}
                            style={{ width: 160, height: 160 }}
                            contentFit="cover"
                            nativeControls
                            isLooping
                            shouldPlay={false}
                          />
                          <View pointerEvents="none" className="absolute right-3 top-3 z-50">
                            <Icon name="Play" size={24} className="text-white" />
                          </View>
                        </>
                      ) : (
                        <>
                          <Image
                            pointerEvents="none"
                            source={typeof cardImage === 'number' ? cardImage : { uri: cardImage }}
                            style={{ width: 160, height: 160 }}
                            resizeMode="cover"
                          />
                          <View pointerEvents="none" className="absolute right-3 top-3 z-50">
                            <Icon name="Play" size={24} className="text-white" />
                          </View>
                        </>
                      )}
                    </View>
                    <View className="w-full py-2">
                      <ThemedText className="text-sm font-medium" numberOfLines={1}>
                        {branch.name}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
          </CardScroller>
        </Section>

        <Section
          title={t('topPicks')}
          titleSize="lg"
          link="/screens/map"
          linkText={t('commonViewAll')}>
          <CardScroller space={15} className="mt-1.5 pb-4">
            {branchesLoading && (
              <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
                {t('commonLoading')}
              </ThemedText>
            )}
            {!branchesLoading &&
              !branchesError &&
              popularBranches?.map((branch) => (
                <Card
                  key={branch.id}
                  title={branch.name}
                  rounded="2xl"
                  hasFavorite
                  favoriteEntityType="branch"
                  favoriteEntityId={branch.id}
                  href={`/screens/branch-detail?id=${branch.id}`}
                  width={160}
                  imageHeight={160}
                  image={branchCardImage(branch)}
                />
              ))}
          </CardScroller>
        </Section>
      </AnimatedView>
    </ThemeScroller>
  );
}
