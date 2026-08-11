import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, View, type ImageSourcePropType } from 'react-native';

import Favorite from '@/components/Favorite';
import MediaCardTitle from '@/components/MediaCardTitle';
import BranchAddress from '@/components/shared/BranchAddress';

interface FavoriteMediaCardProps {
  href?: string;
  title: string;
  image: string | ImageSourcePropType;
  entityType?: string;
  entityId?: string;
  showFavorite?: boolean;
  address?: string;
  onFavoriteToggle?: (isFavorite: boolean) => void;
  /** Seznam oblíbených — srdce hned vyplněné. Jinak stav z API. */
  favoriteInitialState?: boolean;
  showFavoriteToggleSheet?: boolean;
  titleTrailing?: React.ReactNode;
  /** Sekundární obsah pod titulkem uvnitř Pressable (stejný rytmus jako `address`). */
  belowTitle?: React.ReactNode;
  /** Obsah pod titulkem mimo hlavní Pressable (např. slot pills). */
  footer?: React.ReactNode;
}

/** Mezera fotka → jméno — padding na bloku (margin ve flex-row neodsune řádek od fotky). */
const MEDIA_CARD_IMAGE_TITLE_GAP_CLASS = 'pt-1.5';

/** Portrait media karta — aspect 2/3, jméno pod fotkou (web MediaCard). */
export default function FavoriteMediaCard({
  href,
  title,
  image,
  entityType,
  entityId,
  showFavorite,
  address,
  onFavoriteToggle,
  favoriteInitialState = false,
  showFavoriteToggleSheet = true,
  titleTrailing,
  belowTitle,
  footer,
}: FavoriteMediaCardProps) {
  const imageSource = typeof image === 'string' ? { uri: image } : image;
  const showFavoriteHeart =
    showFavorite !== false && Boolean(entityType && entityId);

  const cardBody = (
    <>
      <View className="relative w-full overflow-hidden rounded-2xl bg-black">
        <Image
          source={imageSource}
          className="w-full"
          style={{ aspectRatio: 2 / 3 }}
          contentFit="cover"
        />
        {showFavoriteHeart ? (
          <View className="absolute right-3 top-3 z-10">
            <Favorite
              initialState={favoriteInitialState}
              isWhite
              showToggleSheet={showFavoriteToggleSheet}
              title={title}
              entityType={entityType!}
              entityId={entityId!}
              size={24}
              onToggle={onFavoriteToggle}
            />
          </View>
        ) : null}
      </View>
      <View className={`w-full ${MEDIA_CARD_IMAGE_TITLE_GAP_CLASS}`}>
        {titleTrailing ? (
          <View className="flex-row flex-wrap items-center gap-1.5">
            <MediaCardTitle>{title}</MediaCardTitle>
            <View className="shrink-0">{titleTrailing}</View>
          </View>
        ) : (
          <MediaCardTitle>{title}</MediaCardTitle>
        )}
      </View>
      {belowTitle ? <View className="mt-0.5 w-full">{belowTitle}</View> : null}
    </>
  );

  return (
    <View className="w-full">
      {href ? (
        <Pressable className="w-full" onPress={() => router.push(href as never)}>
          {cardBody}
        </Pressable>
      ) : (
        <View className="w-full">{cardBody}</View>
      )}
      {address ? (
        <BranchAddress address={address} className="mt-0.5" numberOfLines={2} />
      ) : null}
      {footer}
    </View>
  );
}
