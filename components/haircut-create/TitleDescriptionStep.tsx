import React from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import { Chip } from '@/components/Chip';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import { STEP_HORIZONTAL_INSET_PX } from '@/components/haircut-create/constants';
import type { HaircutStepProps } from '@/components/haircut-create/types';
import Section from '@/components/layout/Section';
import { HAIRCUT_TITLE_SUGGESTION_KEYS } from '@/constants/haircutTitleSuggestions';

export default function TitleDescriptionStep({ data, updateData }: HaircutStepProps) {
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();

  return (
    <ScrollView className="p-4 px-8">
      <View className="mb-10">
        <ThemedText className="mt-auto text-3xl font-semibold">
          {t('haircutCreateNowName')}
        </ThemedText>
        <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
          {t('haircutCreateShortName')}
        </ThemedText>
      </View>

      <Section title={t('haircutCreateTitle')} titleSize="md" padding="sm">
        <Input
          variant="classic"
          containerClassName="mt-1 mb-0"
          placeholder="e.g. Low Fade, Summer look"
          value={data.title}
          onChangeText={(text) => updateData({ title: text })}
          maxLength={50}
        />
        <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
          {data.title.length}/50
        </ThemedText>
        <ThemedText className="mb-2 mt-3 text-xs text-light-subtext dark:text-dark-subtext">
          {t('haircutCreateTitleQuickIdeas')}
        </ThemedText>
        <View
          className="mt-1"
          style={{
            width: windowWidth,
            marginLeft: -STEP_HORIZONTAL_INSET_PX,
            marginRight: -STEP_HORIZONTAL_INSET_PX,
          }}>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View className="flex-row items-center gap-2 pb-1 pl-4">
              {HAIRCUT_TITLE_SUGGESTION_KEYS.map((key) => {
                const label = t(key);
                const selected = data.title.trim() === label.trim();
                return (
                  <View key={key} className="shrink-0">
                    <Chip
                      size="lg"
                      label={label}
                      isSelected={selected}
                      onPress={() => updateData({ title: label.slice(0, 50) })}
                    />
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </Section>

      <Section title={t('haircutCreateDescription')} titleSize="md" padding="sm" className="mt-6">
        <Input
          variant="classic"
          containerClassName="mt-1 mb-0"
          placeholder="Optional note about the haircut"
          value={data.description}
          onChangeText={(text) => updateData({ description: text })}
          isMultiline
          maxLength={500}
        />
        <ThemedText className="mt-1 text-xs text-light-subtext dark:text-dark-subtext">
          {data.description.length}/500
        </ThemedText>
      </Section>
    </ScrollView>
  );
}
