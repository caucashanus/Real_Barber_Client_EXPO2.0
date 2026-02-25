import React, { useState, useRef, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Icon from './Icon';
import { Button } from './Button';
import { useThemeColors } from '@/app/contexts/ThemeColors';
import ActionSheetThemed from './ActionSheetThemed';
import { ActionSheetRef } from 'react-native-actions-sheet';
import ThemedText from './ThemedText';
import { router } from 'expo-router';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  getFavorites,
  addFavorite,
  deleteFavorite,
  type FavoriteEntityType,
} from '@/api/favorites';

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
    return () => { cancelled = true; };
  }, [useApi, apiToken, entityType, entityId]);

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
          actionSheetRef.current?.show();
        } else {
          if (favoriteId) {
            await deleteFavorite(apiToken, favoriteId);
            setFavoriteId(null);
          }
          setIsFavorite(false);
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
    <>
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

      <ActionSheetThemed
        ref={actionSheetRef}
        gestureEnabled
      >
        <View className="p-4 pb-6">
          <ThemedText className="text-lg font-bold mt-4 mb-1 text-left">
            {isFavorite ? 'Added to Bookmarks' : 'Removed from Bookmarks'}
          </ThemedText>

          <ThemedText className="text-left mb-6">
            {isFavorite
              ? `${displayTitle} has been added to your bookmarks.`
              : `${displayTitle} has been removed from your bookmarks.`
            }
          </ThemedText>

          <View className="flex-row w-full justify-center">
            {isFavorite && (
              <Button
                title="View Bookmarks"
                className="flex-1"
                onPress={handleViewFavorites}
              />
            )}

            <Button
              title="Continue Browsing"
              variant="outline"
              className={isFavorite ? "ml-3 px-6" : "px-6"}
              onPress={() => actionSheetRef.current?.hide()}
            />
          </View>
        </View>
      </ActionSheetThemed>
    </>
  );
};

export default Favorite; 