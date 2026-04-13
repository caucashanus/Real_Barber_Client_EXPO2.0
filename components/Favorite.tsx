import { router } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import ActionSheetThemed from './ActionSheetThemed';
import { Button } from './Button';
import Icon from './Icon';
import ThemedText from './ThemedText';

import {
  getFavorites,
  addFavorite,
  deleteFavorite,
  type FavoriteEntityType,
} from '@/api/favorites';
import { useAuth } from '@/app/contexts/AuthContext';
import { useFavoritesSync } from '@/app/contexts/FavoritesSyncContext';
import { useThemeColors } from '@/app/contexts/ThemeColors';
import { useTranslation } from '@/app/hooks/useTranslation';

interface FavoriteProps {
  initialState?: boolean;
  size?: number;
  className?: string;
  productName?: string;
  isWhite?: boolean;
  onToggle?: (isFavorite: boolean) => void;
  /** When set, syncs with API: load state from GET favorites, add/remove via POST/DELETE */
  entityType?: FavoriteEntityType;
  entityId?: string;
  title?: string;
}

const Favorite: React.FC<FavoriteProps> = ({
  initialState = false,
  size = 24,
  className = '',
  productName = 'Product',
  onToggle,
  isWhite = false,
  entityType,
  entityId,
  title,
}) => {
  const { apiToken } = useAuth();
  const { t } = useTranslation();
  const { favoritesVersion, notifyFavoritesChanged } = useFavoritesSync();
  const [isFavorite, setIsFavorite] = useState(initialState);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const colors = useThemeColors();

  const displayTitle = title ?? productName;
  const useApi = Boolean(apiToken && entityType && entityId);

  useEffect(() => {
    if (!useApi || !apiToken || !entityType || !entityId) return;
    let cancelled = false;
    getFavorites(apiToken, { entityType })
      .then((list) => {
        if (cancelled) return;
        const found = list.find((f) => f.entityId === entityId);
        if (found) {
          setIsFavorite(true);
          setFavoriteId(found.id);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [useApi, apiToken, entityType, entityId, favoritesVersion]);

  const handleToggle = async () => {
    const newState = !isFavorite;
    if (useApi && apiToken) {
      setLoading(true);
      try {
        if (newState) {
          const created = await addFavorite(apiToken, {
            entityType: entityType!,
            entityId: entityId!,
            title: displayTitle || undefined,
          });
          setFavoriteId(created.id);
          setIsFavorite(true);
          notifyFavoritesChanged();
          actionSheetRef.current?.show();
        } else {
          if (favoriteId) {
            await deleteFavorite(apiToken, favoriteId);
            setFavoriteId(null);
          }
          setIsFavorite(false);
          notifyFavoritesChanged();
          actionSheetRef.current?.show();
        }
        onToggle?.(newState);
      } catch {
        // keep previous state on error
      } finally {
        setLoading(false);
      }
    } else {
      setIsFavorite(newState);
      actionSheetRef.current?.show();
      onToggle?.(newState);
    }
  };

  const handleViewFavorites = () => {
    actionSheetRef.current?.hide();
    router.push('/favorites');
  };

  return (
    <View>
      <Pressable onPress={handleToggle} disabled={loading} className={className}>
        {isWhite ? (
          <Icon
            name="Heart"
            size={size}
            fill={isFavorite ? colors.highlight : 'rgba(0,0,0,0.3)'}
            color={isFavorite ? colors.highlight : 'white'}
            strokeWidth={1.8}
          />
        ) : (
          <Icon
            name="Heart"
            size={size}
            fill={isFavorite ? colors.highlight : 'none'}
            color={isFavorite ? colors.highlight : colors.icon}
            strokeWidth={1.8}
          />
        )}
      </Pressable>

      <ActionSheetThemed ref={actionSheetRef} gestureEnabled>
        <View className="p-4 pb-6">
          <ThemedText className="mb-1 mt-4 text-left text-lg font-bold">
            {isFavorite ? t('favoritesSheetTitleAdded') : t('favoritesSheetTitleRemoved')}
          </ThemedText>

          <ThemedText className="mb-6 text-left">
            {isFavorite
              ? `${displayTitle} ${t('favoritesSheetMessageAdded')}`
              : `${displayTitle} ${t('favoritesSheetMessageRemoved')}`}
          </ThemedText>

          <View className="w-full flex-col gap-3">
            {isFavorite && (
              <Button
                title={t('favoritesSheetViewFavourites')}
                className="w-full"
                onPress={handleViewFavorites}
              />
            )}

            <Button
              title={t('favoritesSheetContinueBrowsing')}
              variant="outline"
              className="w-full"
              onPress={() => actionSheetRef.current?.hide()}
            />
          </View>
        </View>
      </ActionSheetThemed>
    </View>
  );
};

export default Favorite;
