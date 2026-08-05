import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, ViewStyle } from 'react-native';

import ThemedText from './ThemedText';

import { useThemeColors } from '@/contexts/ThemeColors';

interface ShowRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  displayMode?: 'number' | 'stars';
  /** When displayMode is number, show average before the star icon. */
  numberFirst?: boolean;
  className?: string;
  color?: string;
  style?: ViewStyle;
}

const ShowRating: React.FC<ShowRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  displayMode = 'number',
  numberFirst = false,
  className = '',
  color,
  style,
}) => {
  const colors = useThemeColors();

  const starColor = color || colors.text;

  const getSize = () => {
    switch (size) {
      case 'sm':
        return { icon: 12, text: 'text-xs' };
      case 'md':
        return { icon: 16, text: 'text-sm' };
      case 'lg':
        return { icon: 20, text: 'text-base' };
      default:
        return { icon: 16, text: 'text-sm' };
    }
  };

  if (displayMode === 'number') {
    const { icon, text } = getSize();
    const ratingLabel = rating.toFixed(1);
    const ratingText = (
      <ThemedText
        className={`font-medium ${text}`}
        style={color ? { color: starColor } : undefined}>
        {ratingLabel}
      </ThemedText>
    );
    const starIcon = <Ionicons name="star" size={icon} color={starColor} />;

    return (
      <View className={`flex-row items-center gap-x-1 ${className}`} style={style}>
        {numberFirst ? ratingText : starIcon}
        {numberFirst ? starIcon : ratingText}
      </View>
    );
  }

  return (
    <View className={`flex-row gap-0.5 ${className}`}>
      {[...Array(maxRating)].map((_, index) => (
        <Ionicons
          key={index}
          name={index < Math.round(rating) ? 'star' : 'star-outline'}
          size={getSize().icon}
          color={starColor}
        />
      ))}
    </View>
  );
};

export default ShowRating;
