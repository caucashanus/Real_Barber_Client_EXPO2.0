import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { HOME_FAST_BOOK_SHEET_FOOTER } from '@/components/home/fast-book/homeFastBookSheetUi';
import { PreferredContactChannelList } from '@/components/shared/preferred-contact/preferredContactChannelUi';
import ThemedText from '@/components/ThemedText';
import useThemeColors from '@/contexts/ThemeColors';
import { useTranslation } from '@/hooks/useTranslation';
import {
  VISIT_PLAN_CONTACT_METHODS,
  type VisitPlanContactMethod,
  type VisitPlanPreferences,
} from '@/utils/visitPlanTypes';

type Props = {
  onSave: () => void;
  saving?: boolean;
  prefs: VisitPlanPreferences;
  onChange: (next: VisitPlanPreferences) => void;
  profilePhone?: string | null;
};

/** Vnořený panel — preferovaný kontakt (multi-select SMS + telefon). */
export default function VisitPlanSettingsContactPanel({
  onSave,
  saving = false,
  prefs,
  onChange,
  profilePhone,
}: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const onToggleMulti = useCallback(
    (channel: VisitPlanContactMethod) => {
      const key = channel === 'phone' ? 'phone' : 'sms';
      const next = { ...prefs.contactRemind, [key]: !prefs.contactRemind[key] };
      if (!next.sms && !next.phone) return;
      onChange({ ...prefs, contactRemind: next });
    },
    [onChange, prefs]
  );

  return (
    <View>
      <View className="gap-1 px-4 pb-2 pt-2">
        <ThemedText className="mb-2 text-base font-semibold">
          {t('visitPlanPreferredContactTitle')}
        </ThemedText>

        <PreferredContactChannelList
          channels={VISIT_PLAN_CONTACT_METHODS}
          selectionMode="multi"
          selectedMulti={prefs.contactRemind}
          profilePhone={profilePhone}
          t={t}
          onToggleMulti={onToggleMulti}
        />
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Button
          title={saving ? t('visitPlanLoading') : t('visitPlanSettingsSubSave')}
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
