import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Pressable, ActivityIndicator } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemeScroller from '@/components/ThemeScroller';
import { Placeholder } from '@/components/Placeholder';
import Grid from '@/components/layout/Grid';
import AnimatedView from '@/components/AnimatedView';
import Header, { HeaderIcon } from '@/components/Header';
import Card from '@/components/Card';
import Icon from '@/components/Icon';
import { useCollapsibleTitle } from '@/app/hooks/useCollapsibleTitle';
import { useAuth } from '@/app/contexts/AuthContext';
import { useFavoritesSync } from '@/app/contexts/FavoritesSyncContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { getFavorites, deleteFavorite, type Favorite } from '@/api/favorites';

function favoriteHref(fav: Favorite): string {
  switch (fav.entityType) {
    case 'branch':
      return `/screens/branch-detail?id=${fav.entityId}`;
    case 'employee':
      return `/screens/barber-detail?id=${fav.entityId}`;
    case 'item':
      return `/screens/service-detail?id=${fav.entityId}`;
    case 'product':
      return `/screens/product-detail?id=${encodeURIComponent(fav.entityId)}`;
    default:
      return '/screens/favorite-list';
  }
}

function favoriteCategoryBadgeText(
  fav: Favorite,
  t: (key: string) => string
): string {
  const raw = fav.category?.trim();
  if (raw) return raw;

  switch (fav.entityType) {
    case 'branch':
      return t('favoritesBadgeBranch');
    case 'employee':
      return t('favoritesBadgeBarber');
    case 'item':
    case 'service':
      return t('favoritesBadgeService');
    case 'product':
      return t('favoritesBadgeProduct');
    case 'promotion':
      return t('favoritesBadgePromotion');
    case 'guide':
      return t('favoritesBadgeGuide');
    default:
      return fav.entityType;
  }
}

function getFavoriteImageUrl(fav: Favorite): string | undefined {
  const photoUrl = (fav as { photoUrl?: unknown }).photoUrl;
  if (typeof photoUrl === 'string' && photoUrl.length > 0) return photoUrl;

  const avatarUrl = (fav as { avatarUrl?: unknown }).avatarUrl;
  if (typeof avatarUrl === 'string' && avatarUrl.length > 0) return avatarUrl;

  return undefined;
}

const FavoritesScreen = () => {
  const { t } = useTranslation();
  const [isEditMode, setIsEditMode] = useState(false);
  const { scrollY, scrollHandler, scrollEventThrottle } = useCollapsibleTitle();
  const { apiToken } = useAuth();
  const { favoritesVersion, notifyFavoritesChanged } = useFavoritesSync();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = () => {
    if (!apiToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getFavorites(apiToken)
      .then(setFavorites)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [apiToken, favoritesVersion])
  );

  const handleRemove = (favoriteId: string) => {
    if (!apiToken) return;
    deleteFavorite(apiToken, favoriteId)
      .then(() => setFavorites((prev) => prev.filter((f) => f.id !== favoriteId)))
      .then(() => notifyFavoritesChanged())
      .catch(() => {});
  };

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <AnimatedView animation="scaleIn" className="flex-1">
        <Header
          rightComponents={[
            <HeaderIcon
              key="edit"
              icon={isEditMode ? 'Check' : 'Edit2'}
              onPress={() => setIsEditMode(!isEditMode)}
              href="0"
            />,
          ]}
          title={t('favoritesTabTitle')}
          variant="collapsibleTitle"
          scrollY={scrollY}
        />
        <ThemeScroller
          onScroll={scrollHandler}
          scrollEventThrottle={scrollEventThrottle}
          className="pt-4 px-global"
        >
          {loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" />
              <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">Loading…</ThemedText>
            </View>
          ) : error ? (
            <View className="py-12">
              <ThemedText className="text-center text-red-500 dark:text-red-400">{error}</ThemedText>
            </View>
          ) : favorites.length > 0 ? (
            <Grid className="mt-2" columns={2} spacing={20}>
              {favorites.map((fav) => (
                <Card
                  href={favoriteHref(fav)}
                  key={fav.id}
                  title={fav.title ?? '—'}
                  image={getFavoriteImageUrl(fav) ?? require('@/assets/img/barbers.png')}
                  badge={favoriteCategoryBadgeText(fav, t)}
                  imageHeight={180}
                  rounded="2xl"
                >
                  {isEditMode && (
                    <Pressable
                      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-light-primary dark:bg-dark-primary items-center justify-center"
                      onPress={() => handleRemove(fav.id)}
                    >
                      <Icon name="X" size={18} strokeWidth={2} />
                    </Pressable>
                  )}
                </Card>
              ))}
            </Grid>
          ) : (
            <Placeholder
              title={t('favoritesNoFavoritesYet')}
              subtitle={t('favoritesBrowseSubtitle')}
            />
          )}
        </ThemeScroller>
      </AnimatedView>
    </View>
  );
};

export default FavoritesScreen; 