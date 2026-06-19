import React from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import ThemedText from '@/components/ThemedText';

interface ProductDetailBottomBarProps {
  totalPrice: string;
  priceLabel: string;
  buttonTitle: string;
  buttonHref: string;
  paddingBottom: number;
}

export default function ProductDetailBottomBar({
  totalPrice,
  priceLabel,
  buttonTitle,
  buttonHref,
  paddingBottom,
}: ProductDetailBottomBarProps) {
  return (
    <View
      style={{ paddingBottom }}
      className=" flex-row items-center justify-start border-t border-neutral-200 px-global pt-4 dark:border-dark-secondary">
      <View>
        <ThemedText variant="h3">
          {totalPrice}
          {priceLabel ? ` ${priceLabel}` : ''}
        </ThemedText>
      </View>
      <View className="ml-auto flex-row items-center">
        <Button
          title={buttonTitle}
          variant="primary"
          className="ml-6 px-6"
          textClassName="text-white"
          size="medium"
          href={buttonHref}
          rounded="lg"
        />
      </View>
    </View>
  );
}
