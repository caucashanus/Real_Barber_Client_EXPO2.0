import React, { useState, useEffect } from 'react';
import { View, Image, ImageSourcePropType, Platform, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import ThemedText from './ThemedText';

const MARKER_SIZE = 40;
const MARKER_IMAGE_SIZE = 40;

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

  const [tracksViewChanges, setTracksViewChanges] = useState(Platform.OS === 'android');
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const t = setTimeout(() => setTracksViewChanges(false), 1000);
    return () => clearTimeout(t);
  }, []);

  const handleImageLoad = () => {
    if (Platform.OS === 'android') setTracksViewChanges(false);
  };

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
    >
      <View
        style={[
          styles.markerWrap,
          { width: MARKER_SIZE, height: MARKER_SIZE },
          isSelected && styles.markerSelected
        ]}
        className={`rounded-xl overflow-hidden ${isSelected ? 'border-2 border-white' : ''}`}
      >
        {showLocalLogo ? (
          <Image
            source={imageSource!}
            style={{ width: MARKER_IMAGE_SIZE, height: MARKER_IMAGE_SIZE }}
            className="rounded-lg bg-white"
            resizeMode="contain"
            onLoadEnd={handleImageLoad}
          />
        ) : showRemoteLogo ? (
          <>
            <Image
              source={{ uri: imageUrl! }}
              style={{ width: 48, height: 48 }}
              className="rounded-t-xl bg-light-secondary dark:bg-dark-secondary"
              resizeMode="cover"
              onLoadEnd={handleImageLoad}
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
          <View style={styles.priceWrap} className="rounded-lg px-3 py-2 min-w-[60px] bg-black">
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

const styles = StyleSheet.create({
  markerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerSelected: {
    borderWidth: 2,
    borderColor: 'white',
  },
  priceWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PriceMarker; 