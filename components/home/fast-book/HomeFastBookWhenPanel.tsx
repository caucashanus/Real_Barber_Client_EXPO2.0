import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import {
  HOME_FAST_BOOK_WHEN_OPTIONS,
  type HomeFastBookWhenChoice,
} from '@/constants/homeFastBookWhenOptions';
import { HOME_FAST_BOOK_SHEET_FOOTER } from '@/components/home/fast-book/homeFastBookSheetUi';
import useThemeColors from '@/contexts/ThemeColors';
import type { TranslationKey } from '@/locales';

const RADIO_OUTER = 20;
const RADIO_INNER = 10;

function WhenRadioDot({ selected }: { selected: boolean }) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.radioOuter,
        { borderColor: selected ? colors.text : `${colors.text}66` },
      ]}>
      {selected ? (
        <View style={[styles.radioInner, { backgroundColor: colors.text }]} />
      ) : null}
    </View>
  );
}

type Props = {
  choice: HomeFastBookWhenChoice;
  onChoiceChange: (choice: HomeFastBookWhenChoice) => void;
  onConfirm: () => void;
  t: (key: TranslationKey) => string;
};

export default function HomeFastBookWhenPanel({ choice, onChoiceChange, onConfirm, t }: Props) {
  const colors = useThemeColors();
  const title = t('fastBookWhenTitle');

  return (
    <View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={title}
        style={styles.optionsBlock}>
        {HOME_FAST_BOOK_WHEN_OPTIONS.map((option) => {
          const selected = choice === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => onChoiceChange(option.id)}
              style={({ pressed }) => [
                styles.optionRow,
                pressed ? styles.optionRowPressed : null,
              ]}>
              <Icon name={option.icon} size={20} color={colors.text} style={styles.optionIcon} />
              <View style={styles.optionCopy}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {t(option.titleKey)}
                </Text>
                <Text style={[styles.optionSubtitle, { color: colors.placeholder }]}>
                  {t(option.subtitleKey)}
                </Text>
              </View>
              <WhenRadioDot selected={selected} />
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Button
          title={t('fastBookWhenNext')}
          variant="ghost"
          size="medium"
          className="w-full py-4"
          onPress={onConfirm}
          style={{ backgroundColor: colors.text, minHeight: 44 }}
          textClassName={`font-medium ${colors.isDark ? 'text-[#0f0f0f]' : 'text-white'}`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    paddingHorizontal: 16,
    paddingTop: 20,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  optionsBlock: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 0,
    gap: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  optionRowPressed: { opacity: 0.85 },
  optionIcon: { marginTop: 2 },
  optionCopy: { flex: 1, minWidth: 0 },
  optionTitle: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  optionSubtitle: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  radioOuter: {
    width: RADIO_OUTER,
    height: RADIO_OUTER,
    marginTop: 2,
    borderRadius: RADIO_OUTER / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: RADIO_INNER,
    height: RADIO_INNER,
    borderRadius: RADIO_INNER / 2,
  },
  footer: {
    borderTopWidth: 1,
    ...HOME_FAST_BOOK_SHEET_FOOTER,
  },
});
