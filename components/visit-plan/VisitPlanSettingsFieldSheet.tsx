import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { HOME_FAST_BOOK_SHEET_FOOTER } from '@/components/home/fast-book/homeFastBookSheetUi';
import ThemedText from '@/components/ThemedText';
import VisitPlanIntervalWheelPicker from '@/components/visit-plan/VisitPlanIntervalWheelPicker';
import useThemeColors from '@/contexts/ThemeColors';
import { useTranslation } from '@/hooks/useTranslation';
import { clampVisitPlanIntervalDays } from '@/utils/visitPlanIntervalDisplay';
import type { VisitPlanPreferences } from '@/utils/visitPlanTypes';

type Props = {
  onSave: () => void;
  saving?: boolean;
  prefs: VisitPlanPreferences;
  onChange: (next: VisitPlanPreferences) => void;
};

/** Obsah vnořeného panelu — Tvůj ideální rytmus (bez vlastního ActionSheet). */
export default function VisitPlanSettingsIntervalPanel({
  onSave,
  saving = false,
  prefs,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const intervalDays = clampVisitPlanIntervalDays(prefs.intervalDays);

  return (
    <View>
      <View className="px-global pt-2">
        <ThemedText className="mb-6 text-lg font-bold">{t('visitPlanIntervalSheetHeroTitle')}</ThemedText>

        <View className="gap-6">
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
            {t('visitPlanIntervalSheetSubtitle')}
          </ThemedText>

          <View className="w-full max-w-[320px] self-center">
            <VisitPlanIntervalWheelPicker
              days={intervalDays}
              size="default"
              onDaysChange={(next) =>
                onChange({
                  ...prefs,
                  intervalDays: clampVisitPlanIntervalDays(next),
                })
              }
            />
          </View>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Button
          title={saving ? t('visitPlanLoading') : t('visitPlanIntervalSheetSave')}
          variant="primary"
          size="medium"
          className="w-full py-4"
          disabled={saving}
          onPress={onSave}
          style={{ minHeight: 44 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    ...HOME_FAST_BOOK_SHEET_FOOTER,
  },
});
