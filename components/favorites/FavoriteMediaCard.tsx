import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, View, type ImageSourcePropType } from 'react-native';

import Favorite from '@/components/Favorite';
import MediaCardTitle from '@/components/MediaCardTitle';
import ThemedText from '@/components/ThemedText';

interface FavoriteMediaCardProps {
  href: string;
  title: string;
  image: string | ImageSourcePropType;
  entityType: string;
  entityId: string;
  address?: string;
  onFavoriteToggle?: (isFavorite: boolean) => void;
}

/** Portrait oblíbené — aspect 2/3, jméno pod fotkou (web MediaCard). */
export default function FavoriteMediaCard({
  href,
  title,
  image,
  entityType,
  entityId,
  address,
  onFavoriteToggle,
}: FavoriteMediaCardProps) {
  const imageSource = typeof image === 'string' ? { uri: image } : image;

  return (
    <Pressable className="w-full" onPress={() => router.push(href)}>
      <View className="relative w-full overflow-hidden rounded-2xl bg-black">
        <Image
          source={imageSource}
          className="w-full"
          style={{ aspectRatio: 2 / 3 }}
          contentFit="cover"
        />
        <View className="absolute right-3 top-3 z-10">
          <Favorite
            initialState
            isWhite
            showToggleSheet={false}
            title={title}
            entityType={entityType}
            entityId={entityId}
            size={24}
            onToggle={onFavoriteToggle}
          />
        </View>
      </View>
      <MediaCardTitle className="mt-1.5">{title}</MediaCardTitle>
      {address ? (
        <ThemedText
          className="mt-0.5 text-sm text-light-subtext dark:text-dark-subtext"
          numberOfLines={2}>
          {address}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}
