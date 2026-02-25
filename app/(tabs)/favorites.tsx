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
import { getFavorites, deleteFavorite, type Favorite } from '@/api/favorites';

function favoriteHref(fav: Favorite): string {
  switch (fav.entityType) {
    case 'branch':
      return `/screens/branch-detail?id=${fav.entityId}`;
    case 'employee':
      return `/screens/barber-detail?id=${fav.entityId}`;
    case 'item':
      return `/screens/service-detail?id=${fav.entityId}`;
    default:
      return '/screens/favorite-list';
  }
}

function favoriteTypeLabel(entityType: string): string {
  switch (entityType) {
    case 'branch': return 'Branch';
    case 'employee': return 'Barber';
    case 'item': return 'Service';
    default: return entityType;
  }
}

const FavoritesScreen = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const { scrollY, scrollHandler, scrollEventThrottle } = useCollapsibleTitle();
  const { apiToken } = useAuth();
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
    }, [apiToken])
  );

  const handleRemove = (favoriteId: string) => {
    if (!apiToken) return;
    deleteFavorite(apiToken, favoriteId)
      .then(() => setFavorites((prev) => prev.filter((f) => f.id !== favoriteId)))
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
          title="Favorites"
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
                  image={require('@/assets/img/room-1.avif')}
                  description={favoriteTypeLabel(fav.entityType)}
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
              title="No favorites yet"
              subtitle="Browse branches, barbers and services and save your favorites"
            />
          )}
        </ThemeScroller>
      </AnimatedView>
    </View>
  );
};

export default FavoritesScreen; 