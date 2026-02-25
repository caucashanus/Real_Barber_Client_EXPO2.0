import React from 'react';
import { View, Image, ImageSourcePropType } from 'react-native';
import { Marker } from 'react-native-maps';
import ThemedText from './ThemedText';

interface PriceMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  price?: string;
  title?: string;
  /** When set, marker shows logo + title instead of price */
  imageUrl?: string | null;
  /** Hardcoded local logo (require()). When set, marker shows only this image. */
  imageSource?: ImageSourcePropType | null;
  onPress?: () => void;
  isSelected?: boolean;
}

const PriceMarker: React.FC<PriceMarkerProps> = ({
  coordinate,
  price = '',
  title,
  imageUrl,
  imageSource,
  onPress,
  isSelected = false
}) => {
  const showLocalLogo = Boolean(imageSource);
  const showRemoteLogo = Boolean(imageUrl?.trim()) && !showLocalLogo;

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
    >
      <View
        className={`
          rounded-xl overflow-hidden items-center justify-center
          ${isSelected ? 'border-2 border-white' : ''}
        `}
      >
        {showLocalLogo ? (
          <Image
            source={imageSource!}
            className="w-10 h-10 rounded-lg bg-white"
            resizeMode="contain"
          />
        ) : showRemoteLogo ? (
          <>
            <Image
              source={{ uri: imageUrl! }}
              className="w-12 h-12 rounded-t-xl bg-light-secondary dark:bg-dark-secondary"
              resizeMode="cover"
            />
            <View className="px-2 py-1 min-w-0 max-w-[100px] bg-black">
              <ThemedText
                className="text-white text-xs font-bold"
                numberOfLines={1}
              >
                {title || '—'}
              </ThemedText>
            </View>
          </>
        ) : (
          <View className="rounded-lg px-3 py-2 min-w-[60px] items-center justify-center bg-black">
            <ThemedText
              className="text-white text-sm font-bold"
              numberOfLines={1}
            >
              {price}
            </ThemedText>
          </View>
        )}
      </View>
    </Marker>
  );
};

export default PriceMarker; 