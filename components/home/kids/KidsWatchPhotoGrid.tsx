import { Image } from 'expo-image';
import React from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';

import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
const GAP = 8;
const COLS = 2;
/** Dashed „Přidat fotku“ / „Vyfotit“ — stejný vzhled, menší než náhledy. */
const ADD_CELL_SCALE = 0.82;

type Props = {
  uris: string[];
  maxPhotos: number;
  onAddGallery: () => void;
  onAddCamera: () => void;
  onRemove: (uri: string) => void;
  galleryLabel: string;
  cameraLabel: string;
  maxLabel: string;
};

export default function KidsWatchPhotoGrid({
  uris,
  maxPhotos,
  onAddGallery,
  onAddCamera,
  onRemove,
  galleryLabel,
  cameraLabel,
  maxLabel,
}: Props) {
  const { width } = useWindowDimensions();
  const horizontalPad = 32;
  const cellSize = Math.floor((width - horizontalPad - GAP) / COLS);
  const addCellSize = Math.max(128, Math.floor(cellSize * ADD_CELL_SCALE));

  if (uris.length >= maxPhotos) {
    return (
      <View>
        <View className="flex-row flex-wrap" style={{ gap: GAP }}>
          {uris.map((uri) => (
            <PhotoCell
              key={uri}
              size={cellSize}
              uri={uri}
              onRemove={() => onRemove(uri)}
            />
          ))}
        </View>
        <ThemedText className="mt-3 text-sm text-light-subtext dark:text-dark-subtext">
          {maxLabel}
        </ThemedText>
      </View>
    );
  }

  return (
    <View>
      {uris.length > 0 ? (
        <View className="flex-row flex-wrap" style={{ gap: GAP }}>
          {uris.map((uri) => (
            <PhotoCell
              key={uri}
              size={cellSize}
              uri={uri}
              onRemove={() => onRemove(uri)}
            />
          ))}
        </View>
      ) : null}
      <View
        className="flex-row justify-center"
        style={{ gap: GAP, marginTop: uris.length > 0 ? GAP : 0 }}>
        <DashedAddCell size={addCellSize} label={galleryLabel} onPress={onAddGallery} />
        <DashedAddCell size={addCellSize} label={cameraLabel} onPress={onAddCamera} />
      </View>
    </View>
  );
}

function PhotoCell({
  size,
  uri,
  onRemove,
}: {
  size: number;
  uri: string;
  onRemove: () => void;
}) {
  return (
    <View style={{ width: size, height: size }} className="relative overflow-hidden rounded-xl">
      <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" />
      <Pressable
        onPress={onRemove}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Remove photo"
        className="absolute right-1 top-1 h-7 w-7 items-center justify-center rounded-full bg-red-500">
        <Icon name="X" size={16} color="#fff" strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

function DashedAddCell({
  size,
  label,
  onPress,
}: {
  size: number;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width: size, height: size }}
      className="items-center justify-center rounded-xl border border-dashed border-light-subtext/40 px-2 dark:border-dark-subtext/45 active:opacity-70">
      <Icon
        name="Plus"
        size={size < 130 ? 18 : 22}
        className="mb-1 text-light-subtext dark:text-dark-subtext"
      />
      <ThemedText className="text-center text-xs text-light-subtext dark:text-dark-subtext">
        {label}
      </ThemedText>
    </Pressable>
  );
}
