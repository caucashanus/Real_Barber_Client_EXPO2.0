import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import useThemeColors from '@/contexts/ThemeColors';
import { triggerImpact } from '@/utils/appHaptics';

interface StarRatingPickerProps {
  rating: number;
  onChange: (rating: number) => void;
}

export default function StarRatingPicker({ rating, onChange }: StarRatingPickerProps) {
  const colors = useThemeColors();

  const handlePress = (starIndex: number) => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
    const next = starIndex + 1;
    onChange(next === rating ? 0 : next);
  };

  return (
    <View className="my-4 flex-row justify-center">
      {[0, 1, 2, 3, 4].map((starIndex) => (
        <TouchableOpacity
          key={starIndex}
          accessibilityRole="button"
          accessibilityLabel={`${starIndex + 1}`}
          onPress={() => handlePress(starIndex)}
          className="h-11 w-11 items-center justify-center">
          <FontAwesome
            name={rating > starIndex ? 'star' : 'star-o'}
            size={32}
            color={rating > starIndex ? colors.highlight : colors.text}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}
