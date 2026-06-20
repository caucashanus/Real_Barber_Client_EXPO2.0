import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, View, ActivityIndicator } from 'react-native';

import { ScrollContext } from './_layout';

import { getBranches, type Branch, type BranchService } from '@/api/branches';
import { getClientReviewsList, type ClientReviewListItem } from '@/api/reviews';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { CLIENT_APP_V1_ENABLED } from '@/constants/clientAppApi';
import AnimatedView from '@/components/AnimatedView';
import Card from '@/components/Card';
import { CardScroller } from '@/components/CardScroller';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';
import { BRANCHES_GALLERY_CARD, BRANCHES_GALLERY_ITEMS } from '@/constants/branchesGallery';
import { shadowPresets } from '@/utils/useShadow';

function getServicesList(branch: Branch): BranchService[] {
  const s = branch.services;
  if (!s) return [];
  if (Array.isArray(s)) return s;
  return Object.values(s);
}

function getMediaUrlsSorted(media: Branch['media']): string[] {
  if (!media) return [];
  const list = (Array.isArray(media) ? [...media] : Object.values(media ?? {})) as {
    url?: string;
    order?: number;
    type?: string;
  }[];
  const withOrder = list.filter((m): m is { url: string; order?: number } => !!m?.url);
  withOrder.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return withOrder.map((m) => m.url);
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
      CLIENT_APP_V1_ENABLED
        ? Promise.resolve({ reviews: [] as ClientReviewListItem[] })
        : getClientReviewsList(apiToken, { entityType: 'branch', limit: 500 }),
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

  const branchRatingsMap = useMemo(() => {
    if (CLIENT_APP_V1_ENABLED) {
      const out = new Map<string, number>();
      for (const b of branches) {
        if (typeof b.averageRating === 'number') out.set(b.id, b.averageRating);
      }
      return out;
    }
    return computeBranchRatingsMap(branchReviewsList);
  }, [branches, branchReviewsList]);
  const popularBranches = branches.length > 0 ? branches : null;

  if (branchesLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
        <ActivityIndicator size="large" />
        <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">
          {t('commonLoading')}
        </ThemedText>
      </View>
    );
  }

  return (
    <ThemeScroller
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
      })}
      scrollEventThrottle={16}>
      <AnimatedView animation="scaleIn" className="mt-4 flex-1">
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

        <Pressable
          onPress={() => router.push('/screens/map')}
          style={{ ...shadowPresets.large }}
          className="mt-6 flex flex-row items-center rounded-2xl bg-light-primary p-5 dark:bg-dark-secondary">
          <ThemedText className="flex-1 pr-2 text-base font-medium">
            {t('homeContinueSearchBarbershops')}
          </ThemedText>
          <View className="h-20 w-20 items-center justify-center">
            <Image
              className="h-full w-full"
              source={require('@/assets/img/branches.png')}
              contentFit="contain"
            />
          </View>
        </Pressable>

        <Section title={t('branchesGallery')} titleSize="lg" className="mt-6">
          <CardScroller space={15} className="mt-1.5 pb-4">
            {BRANCHES_GALLERY_ITEMS.map((item) => (
              <View
                key={item.id}
                className="overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-secondary"
                style={{
                  width: BRANCHES_GALLERY_CARD.width,
                  height: BRANCHES_GALLERY_CARD.height,
                }}>
                <Image
                  source={item.source}
                  style={{
                    width: BRANCHES_GALLERY_CARD.width,
                    height: BRANCHES_GALLERY_CARD.height,
                  }}
                  contentFit="cover"
                  accessibilityIgnoresInvertColors
                />
              </View>
            ))}
          </CardScroller>
        </Section>
      </AnimatedView>
    </ThemeScroller>
  );
}
