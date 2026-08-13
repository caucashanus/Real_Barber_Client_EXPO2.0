import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { View, ActivityIndicator, useWindowDimensions } from 'react-native';

import { getFavorites, type Favorite } from '@/api/favorites';
import { useAuth } from '@/contexts/AuthContext';
import { useCollapsibleTitle } from '@/hooks/useCollapsibleTitle';
import { useTranslation } from '@/hooks/useTranslation';
import AppButton from '@/components/AppButton';
import AnimatedView from '@/components/AnimatedView';
import { CardScroller } from '@/components/CardScroller';
import FavoriteMediaCard from '@/components/favorites/FavoriteMediaCard';
import Header from '@/components/Header';
import { Placeholder } from '@/components/Placeholder';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Grid from '@/components/layout/Grid';
import {
  countClientFavoritesByFilter,
  filterClientFavorites,
  type ClientFavoriteFilter,
} from '@/utils/clientFavoritesFilter';
import { barberDetailHref, branchDetailHref, serviceDetailHref } from '@/constants/profileDetailRoutes';
import { shouldStaleRefresh } from '@/utils/staleRefresh';

const DESKTOP_BREAKPOINT = 768;
const GRID_GAP = 16;

function favoriteHref(fav: Favorite): string {
  switch (fav.entityType) {
    case 'branch':
      return branchDetailHref(fav.entityId);
    case 'employee':
      return barberDetailHref(fav.entityId);
    case 'service':
    case 'item':
      return serviceDetailHref(fav.entityId);
    case 'product':
      return `/screens/product-detail?id=${encodeURIComponent(fav.entityId)}`;
    case 'guide':
      return `/screens/guide-detail?id=${encodeURIComponent(fav.entityId)}`;
    default:
      return '/screens/favorite-list';
  }
}

function getFavoriteImageUrl(fav: Favorite): string | undefined {
  const photoUrl = (fav as { photoUrl?: unknown }).photoUrl;
  if (typeof photoUrl === 'string' && photoUrl.length > 0) return photoUrl;

  const avatarUrl = (fav as { avatarUrl?: unknown }).avatarUrl;
  if (typeof avatarUrl === 'string' && avatarUrl.length > 0) return avatarUrl;

  return undefined;
}

function getFavoriteBranchAddress(fav: Favorite): string | undefined {
  if ((fav.entityType ?? '').toLowerCase() !== 'branch') return undefined;
  const record = fav as Record<string, unknown>;
  for (const key of ['address', 'branchAddress', 'entityAddress', 'subtitle']) {
    const value = record[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  return undefined;
}

function formatFavoriteFilterLabel(label: string, count: number): string {
  return `${label} ${count}`;
}

const FavoritesScreen = () => {
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const gridColumns = windowWidth >= DESKTOP_BREAKPOINT ? 4 : 2;
  const { scrollY, scrollHandler, scrollEventThrottle } = useCollapsibleTitle();
  const { apiToken } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<ClientFavoriteFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef(0);
  const inflightRef = useRef<Promise<void> | null>(null);

  const counts = countClientFavoritesByFilter(favorites);
  const filteredFavorites = filterClientFavorites(favorites, selectedFilter);

  const loadFavorites = useCallback(
    async (options?: { force?: boolean; silent?: boolean }) => {
      if (!apiToken) {
        setLoading(false);
        setFavorites([]);
        lastFetchRef.current = 0;
        return;
      }

      const force = options?.force ?? false;
      if (!shouldStaleRefresh(lastFetchRef.current, { force })) return;
      if (inflightRef.current) return inflightRef.current;

      const isInitial = lastFetchRef.current === 0;
      const silent = options?.silent ?? false;

      if (isInitial || !silent) {
        setLoading(true);
        setError(null);
      }

      inflightRef.current = getFavorites(apiToken)
        .then((list) => {
          setFavorites(list);
          lastFetchRef.current = Date.now();
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
        .finally(() => {
          setLoading(false);
          inflightRef.current = null;
        });

      return inflightRef.current;
    },
    [apiToken]
  );

  useFocusEffect(
    useCallback(() => {
      void loadFavorites({ force: true, silent: lastFetchRef.current !== 0 });
    }, [loadFavorites])
  );

  const handleFavoriteToggle = useCallback((favoriteId: string, isFavorite: boolean) => {
    if (isFavorite) return;
    setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
  }, []);

  const renderFilters = () => (
    <CardScroller className="mb-4" space={8}>
      <AppButton
        variant="choice"
        size="sm"
        rounded="full"
        selected={selectedFilter === 'all'}
        title={formatFavoriteFilterLabel(t('favoritesFilterAll'), counts.all)}
        onPress={() => setSelectedFilter('all')}
      />
      <AppButton
        variant="choice"
        size="sm"
        rounded="full"
        selected={selectedFilter === 'employee'}
        title={formatFavoriteFilterLabel(t('favoritesEmployees'), counts.employee)}
        onPress={() => setSelectedFilter('employee')}
      />
      <AppButton
        variant="choice"
        size="sm"
        rounded="full"
        selected={selectedFilter === 'branch'}
        title={formatFavoriteFilterLabel(t('favoritesBranches'), counts.branch)}
        onPress={() => setSelectedFilter('branch')}
      />
      <AppButton
        variant="choice"
        size="sm"
        rounded="full"
        selected={selectedFilter === 'service'}
        title={formatFavoriteFilterLabel(t('favoritesServices'), counts.service)}
        onPress={() => setSelectedFilter('service')}
      />
    </CardScroller>
  );

  const renderGrid = () => (
    <Grid className="mt-2" columns={gridColumns} spacing={GRID_GAP}>
      {filteredFavorites.map((fav) => (
        <FavoriteMediaCard
          key={fav.id}
          href={favoriteHref(fav)}
          title={fav.title ?? '—'}
          image={getFavoriteImageUrl(fav) ?? require('@/assets/img/barbers.png')}
          entityType={fav.entityType}
          entityId={fav.entityId}
          address={getFavoriteBranchAddress(fav)}
          favoriteInitialState
          showFavoriteToggleSheet={false}
          onFavoriteToggle={(isFavorite) => handleFavoriteToggle(fav.id, isFavorite)}
        />
      ))}
    </Grid>
  );

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <AnimatedView animation="scaleIn" className="flex-1">
        <Header title={t('favoritesTabTitle')} variant="collapsibleTitle" scrollY={scrollY} />
        <ThemeScroller
          onScroll={scrollHandler}
          scrollEventThrottle={scrollEventThrottle}
          className="px-global pt-4">
          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" />
              <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">
                Loading…
              </ThemedText>
            </View>
          ) : error ? (
            <View className="py-12">
              <ThemedText className="text-center text-red-500 dark:text-red-400">
                {error}
              </ThemedText>
            </View>
          ) : (
            <>
              {renderFilters()}
              {counts.all === 0 ? (
                <Placeholder
                  title={t('favoritesNoFavoritesYet')}
                  subtitle={t('favoritesBrowseSubtitle')}
                />
              ) : filteredFavorites.length === 0 ? (
                <ThemedText className="py-8 text-center text-light-subtext dark:text-dark-subtext">
                  {t('favoritesFilterEmpty')}
                </ThemedText>
              ) : (
                renderGrid()
              )}
            </>
          )}
        </ThemeScroller>
      </AnimatedView>
    </View>
  );
};

export default FavoritesScreen;
