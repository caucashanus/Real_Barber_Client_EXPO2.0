import { Image } from 'expo-image';
import React from 'react';
import { View, type ColorValue } from 'react-native';

export const TAB_BAR_AVATAR_SIZE = 26;

interface TabBarProfileAvatarProps {
  uri: string;
  focused?: boolean;
  borderColor?: ColorValue;
}

export default function TabBarProfileAvatar({
  uri,
  focused = false,
  borderColor,
}: TabBarProfileAvatarProps) {
  const innerSize = focused ? TAB_BAR_AVATAR_SIZE - 4 : TAB_BAR_AVATAR_SIZE;

  return (
    <View
      style={{
        width: TAB_BAR_AVATAR_SIZE,
        height: TAB_BAR_AVATAR_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: TAB_BAR_AVATAR_SIZE / 2,
        overflow: 'hidden',
        borderWidth: focused ? 2 : 0,
        borderColor: focused ? borderColor : 'transparent',
        opacity: focused ? 1 : 0.4,
      }}>
      <Image
        source={{ uri }}
        style={{ width: innerSize, height: innerSize }}
        contentFit="cover"
      />
    </View>
  );
}
