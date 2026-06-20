import React from 'react';
import { View } from 'react-native';

import Icon, { IconName } from '@/components/Icon';
import ShowRating from '@/components/ShowRating';
import ThemedText from '@/components/ThemedText';

interface ProductFeatureItemProps {
  icon: IconName;
  label: string;
  value: string;
}

export function ProductFeatureItem({ icon, label, value }: ProductFeatureItemProps) {
  return (
    <View className="flex-row items-center py-4">
      <Icon name={icon} size={24} strokeWidth={1.5} className="mr-3" />
      <ThemedText className="flex-1">{label}</ThemedText>
      <ThemedText className="font-medium">{value}</ThemedText>
    </View>
  );
}

interface ProductRatingItemProps {
  label: string;
  rating: number;
}

export function ProductRatingItem({ label, rating }: ProductRatingItemProps) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <ThemedText className="text-sm">{label}</ThemedText>
      <View className="flex-row items-center">
        <ShowRating rating={rating} size="sm" />
      </View>
    </View>
  );
}
