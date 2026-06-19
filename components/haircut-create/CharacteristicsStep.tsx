import Slider from '@react-native-community/slider';
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { getEmployees, type Employee } from '@/api/employees';
import { useAuth } from '@/app/contexts/AuthContext';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useTranslation } from '@/app/hooks/useTranslation';
import BarberPicker from '@/components/BarberPicker';
import ThemedText from '@/components/ThemedText';
import type { HaircutStepProps } from '@/components/haircut-create/types';
import Section from '@/components/layout/Section';
import { stylingDifficultyLabel } from '@/utils/haircut-note-build';

export default function CharacteristicsStep({ data, updateData }: HaircutStepProps) {
  const { t } = useTranslation();
  const { apiToken } = useAuth();
  const colors = useThemeColors();
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    if (!apiToken) return;
    getEmployees(apiToken)
      .then(setEmployees)
      .catch(() => setEmployees([]));
  }, [apiToken]);

  return (
    <ScrollView className="p-4 px-8">
      <View className="mb-10">
        <ThemedText variant="h1" className="mt-auto">
          {t('haircutCreateStylingDifficulty')}
        </ThemedText>
        <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
          {t('haircutCreateHowDemanding')}
        </ThemedText>
      </View>

      <Section title={t('haircutCreateDifficulty')} titleSize="md" padding="sm" className="mt-2">
        <Slider
          style={{ width: '100%', height: 40 }}
          value={data.stylingDifficulty}
          minimumValue={0}
          maximumValue={100}
          onValueChange={(v) => updateData({ stylingDifficulty: v })}
          minimumTrackTintColor={colors.highlight}
          maximumTrackTintColor="rgba(0,0,0,0.2)"
          thumbTintColor={colors.highlight}
          step={1}
        />
        <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
          {stylingDifficultyLabel(data.stylingDifficulty)}
        </ThemedText>
      </Section>

      <Section title={t('haircutCreateSelectBarber')} titleSize="md" padding="sm" className="mt-6">
        <View className="-mx-8 mt-6" style={{ marginHorizontal: -32 }}>
          <BarberPicker
            employees={employees}
            value={data.barber_id}
            onChange={(id) => updateData({ barber_id: id })}
            label=""
          />
        </View>
      </Section>
    </ScrollView>
  );
}
