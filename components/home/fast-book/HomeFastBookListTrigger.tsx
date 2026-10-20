import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import Icon from '@/components/Icon';
import { homeFastBookListTriggerBorderColor } from '@/components/home/fast-book/homeFastBookSheetUi';
import useThemeColors from '@/contexts/ThemeColors';

const FRAME_HEIGHT = 48;
const LATER_PILL_HEIGHT = 32;

/** Web `text-muted-foreground` (light globals). */
const LABEL_MUTED_LIGHT = '#64748b';

/** Tailwind `shadow-sm`: 0 1px 2px rgb(0 0 0 / 0.05) — jemné zvednutí, ne spodní pás. */
const FRAME_SHADOW = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  android: {
    elevation: 1,
  },
  default: {},
});

type Props = {
  listLabel: string;
  laterLabel: string;
  /** Jen a11y na pill Později (web `aria-expanded`), bez vizuální změny listy. */
  whenOpenFromList: boolean;
  onOpenServices: () => void;
  onOpenLater: () => void;
};

export default function HomeFastBookListTrigger({
  listLabel,
  laterLabel,
  whenOpenFromList,
  onOpenServices,
  onOpenLater,
}: Props) {
  const colors = useThemeColors();
  const borderColor = homeFastBookListTriggerBorderColor(colors.isDark);

  const labelColor = useMemo(() => {
    if (colors.isDark) return colors.placeholder;
    return LABEL_MUTED_LIGHT;
  }, [colors.isDark, colors.placeholder]);

  return (
    <View
      style={[
        styles.frame,
        FRAME_SHADOW,
        { borderColor, backgroundColor: colors.bg },
      ]}>
      <Pressable
        onPress={onOpenServices}
        accessibilityRole="button"
        style={({ pressed }) => [styles.labelHit, pressed && styles.pressed]}>
        <Text numberOfLines={1} style={[styles.labelText, { color: labelColor }]}>
          {listLabel}
        </Text>
      </Pressable>

      <Pressable
        onPress={onOpenLater}
        accessibilityRole="button"
        accessibilityState={{ expanded: whenOpenFromList }}
        style={({ pressed }) => [
          styles.laterPill,
          { borderColor },
          pressed && styles.pressed,
        ]}>
        <Icon name="Calendar" size={14} color={colors.text} style={styles.laterIcon} />
        <Text style={[styles.laterText, { color: colors.text }]}>{laterLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: FRAME_HEIGHT,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 2,
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 6,
    columnGap: 8,
  },
  labelHit: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 16,
    fontWeight: '400',
    ...(Platform.OS === 'android'
      ? { includeFontPadding: false, textAlignVertical: 'center' as const }
      : null),
  },
  laterPill: {
    alignSelf: 'center',
    height: LATER_PILL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 999,
  },
  laterIcon: {
    marginRight: 6,
  },
  laterText: {
    fontSize: 14,
    fontWeight: '600',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  pressed: {
    opacity: 0.7,
  },
});
