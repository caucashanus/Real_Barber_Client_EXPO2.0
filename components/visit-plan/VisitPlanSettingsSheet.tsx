import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';

import ActionSheetThemed from '@/components/ActionSheetThemed';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import { HOME_FAST_BOOK_OVERLAY, HOME_FAST_BOOK_SHEET_FOOTER, homeFastBookWhenPanelBg } from '@/components/home/fast-book/homeFastBookSheetUi';
import SurfaceCard from '@/components/layout/SurfaceCard';
import {
  ActionSheetNestedDock,
  ActionSheetStackScrim,
  actionSheetNestedStackStyles as stackStyles,
} from '@/components/shared/sheet/ActionSheetNestedDock';
import ThemedText from '@/components/ThemedText';
import VisitPlanSettingsContactPanel from '@/components/visit-plan/VisitPlanSettingsContactSheet';
import VisitPlanSettingsIntervalPanel from '@/components/visit-plan/VisitPlanSettingsFieldSheet';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import useThemeColors from '@/contexts/ThemeColors';
import { useActionSheetVisible } from '@/hooks/useActionSheetVisible';
import { useTranslation } from '@/hooks/useTranslation';
import { formatVisitPlanIntervalEvery } from '@/utils/visitPlanIntervalDisplay';
import { formatVisitPlanContactRemindSubtitle } from '@/utils/visitPlanSettingsDisplay';
import type { VisitPlanPreferences } from '@/utils/visitPlanTypes';

export type VisitPlanSettingsField = 'interval' | 'contact';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefs: VisitPlanPreferences;
  onSavePrefs: (next: VisitPlanPreferences) => Promise<boolean>;
  saving?: boolean;
  initialField?: VisitPlanSettingsField | null;
  onNestedFieldClosed?: () => void;
};

function SettingsNavRow({
  title,
  subtitle,
  onPress,
  showDivider,
  chevronColor,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
  showDivider?: boolean;
  chevronColor: string;
}) {
  return (
    <>
      {showDivider ? (
        <View className="h-px bg-light-secondary dark:bg-dark-secondary" />
      ) : null}
      <Pressable onPress={onPress} className="w-full active:opacity-70">
        <View className="flex-row items-center gap-3 px-4 py-3.5">
          <View className="min-w-0 flex-1">
            <ThemedText className="text-sm font-semibold">{title}</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{subtitle}</ThemedText>
          </View>
          <Icon name="ChevronRight" size={20} color={chevronColor} />
        </View>
      </Pressable>
    </>
  );
}

function SettingsNavList({
  intervalTitle,
  intervalSubtitle,
  contactTitle,
  contactSubtitle,
  onOpenField,
}: {
  intervalTitle: string;
  intervalSubtitle: string;
  contactTitle: string;
  contactSubtitle: string;
  onOpenField: (field: VisitPlanSettingsField) => void;
}) {
  const colors = useThemeColors();
  const chevronColor = colors.placeholder;

  return (
    <SurfaceCard
      rounded="2xl"
      className="overflow-hidden border border-light-secondary p-0 dark:border-dark-secondary">
      <SettingsNavRow
        title={intervalTitle}
        subtitle={intervalSubtitle}
        chevronColor={chevronColor}
        onPress={() => onOpenField('interval')}
      />
      <SettingsNavRow
        title={contactTitle}
        subtitle={contactSubtitle}
        chevronColor={chevronColor}
        showDivider
        onPress={() => onOpenField('contact')}
      />
    </SurfaceCard>
  );
}

function SettingsMainPanel({
  draft,
  saving,
  onSavePrefs,
  onOpenChange,
  onOpenField,
  intervalSubtitle,
  contactSubtitle,
  t,
}: {
  draft: VisitPlanPreferences;
  saving: boolean;
  onSavePrefs: (next: VisitPlanPreferences) => Promise<boolean>;
  onOpenChange: (open: boolean) => void;
  onOpenField: (field: VisitPlanSettingsField) => void;
  intervalSubtitle: string;
  contactSubtitle: string;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const colors = useThemeColors();

  return (
    <View>
      <View className="px-global pt-2">
        <ThemedText className="mb-4 text-lg font-bold">{t('visitPlanSettingsHeading')}</ThemedText>

        <SettingsNavList
          intervalTitle={t('visitPlanSettingsRowInterval')}
          intervalSubtitle={intervalSubtitle}
          contactTitle={t('visitPlanSettingsRowContact')}
          contactSubtitle={contactSubtitle}
          onOpenField={onOpenField}
        />
      </View>

      <View style={[styles.settingsFooter, { borderTopColor: colors.border }]}>
        <Button
          title={saving ? t('visitPlanLoading') : t('visitPlanSavePreferences')}
          variant="primary"
          size="medium"
          className="w-full py-4"
          disabled={saving}
          onPress={() => {
            void (async () => {
              const ok = await onSavePrefs(draft);
              if (ok) onOpenChange(false);
            })();
          }}
          style={{ minHeight: 44 }}
        />
      </View>
    </View>
  );
}

function SettingsStack({
  nestedField,
  dismissNested,
  draft,
  setDraft,
  saving,
  onSavePrefs,
  onOpenChange,
  onOpenField,
  intervalSubtitle,
  contactSubtitle,
  profilePhone,
  t,
}: {
  nestedField: VisitPlanSettingsField | null;
  dismissNested: () => void;
  draft: VisitPlanPreferences;
  setDraft: (next: VisitPlanPreferences) => void;
  saving: boolean;
  onSavePrefs: (next: VisitPlanPreferences) => Promise<boolean>;
  onOpenChange: (open: boolean) => void;
  onOpenField: (field: VisitPlanSettingsField) => void;
  intervalSubtitle: string;
  contactSubtitle: string;
  profilePhone?: string | null;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const colors = useThemeColors();
  const nestedDocked = nestedField != null;
  const baseHeightRef = useRef<number | null>(null);

  const onStackLayout = (event: LayoutChangeEvent) => {
    const height = Math.ceil(event.nativeEvent.layout.height);
    if (!nestedDocked) {
      baseHeightRef.current = height;
      return;
    }
    if (baseHeightRef.current == null) {
      baseHeightRef.current = height;
    }
  };

  const stackHeight =
    nestedDocked && baseHeightRef.current != null ? baseHeightRef.current : undefined;

  const saveDraftFromNested = useCallback(async () => {
    const ok = await onSavePrefs(draft);
    if (!ok) return;
    dismissNested();
  }, [dismissNested, draft, onSavePrefs]);

  const nestedPanelBg = homeFastBookWhenPanelBg(colors.isDark);

  return (
    <View
      style={[stackStyles.stack, stackHeight != null ? { height: stackHeight } : null]}
      onLayout={onStackLayout}>
      <View style={stackStyles.baseLayer} pointerEvents={nestedDocked ? 'none' : 'auto'}>
        <SettingsMainPanel
          draft={draft}
          saving={saving}
          onSavePrefs={onSavePrefs}
          onOpenChange={onOpenChange}
          onOpenField={onOpenField}
          intervalSubtitle={intervalSubtitle}
          contactSubtitle={contactSubtitle}
          t={t}
        />
      </View>

      {nestedDocked ? (
        <>
          <ActionSheetStackScrim onDismiss={dismissNested} />
          <ActionSheetNestedDock
            key={nestedField}
            panelBackgroundColor={nestedPanelBg}
            onDismiss={dismissNested}>
            {nestedField === 'interval' ? (
              <VisitPlanSettingsIntervalPanel
                prefs={draft}
                onChange={setDraft}
                saving={saving}
                onSave={() => void saveDraftFromNested()}
              />
            ) : (
              <VisitPlanSettingsContactPanel
                prefs={draft}
                onChange={setDraft}
                saving={saving}
                profilePhone={profilePhone}
                onSave={() => void saveDraftFromNested()}
              />
            )}
          </ActionSheetNestedDock>
        </>
      ) : null}
    </View>
  );
}

export default function VisitPlanSettingsSheet({
  open,
  onOpenChange,
  prefs,
  onSavePrefs,
  saving = false,
  initialField = null,
  onNestedFieldClosed,
}: Props) {
  const mainRef = useActionSheetVisible(open);
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { client } = useAuth();
  const profilePhone = client?.phone?.trim() || null;
  const [draft, setDraft] = useState(prefs);
  const [nestedField, setNestedField] = useState<VisitPlanSettingsField | null>(null);

  useEffect(() => {
    if (!open) {
      setNestedField(null);
      return;
    }
    setDraft(prefs);
  }, [open, prefs]);

  useEffect(() => {
    if (!open) return;
    setNestedField(initialField ?? null);
  }, [open, initialField]);

  const dismissNested = useCallback(() => {
    setNestedField(null);
    onNestedFieldClosed?.();
  }, [onNestedFieldClosed]);

  const nestedDocked = nestedField != null;

  const handleMainClose = useCallback(() => {
    if (nestedField != null) {
      dismissNested();
      return;
    }
    onOpenChange(false);
  }, [dismissNested, nestedField, onOpenChange]);

  const intervalSubtitle = formatVisitPlanIntervalEvery(draft.intervalDays, t);
  const contactSubtitle = formatVisitPlanContactRemindSubtitle(draft.contactRemind, t);

  if (!open) return null;

  return (
    <ActionSheetThemed
      ref={mainRef}
      gestureEnabled={!nestedDocked}
      closeOnTouchBackdrop={!nestedDocked}
      closeOnPressBack={!nestedDocked}
      defaultOverlayOpacity={
        nestedDocked ? HOME_FAST_BOOK_OVERLAY.whenOpen : HOME_FAST_BOOK_OVERLAY.base
      }
      onTouchBackdrop={() => {
        if (nestedDocked) dismissNested();
      }}
      onClose={handleMainClose}>
      <SettingsStack
        nestedField={nestedField}
        dismissNested={dismissNested}
        draft={draft}
        setDraft={setDraft}
        saving={saving}
        onSavePrefs={onSavePrefs}
        onOpenChange={onOpenChange}
        onOpenField={setNestedField}
        intervalSubtitle={intervalSubtitle}
        contactSubtitle={contactSubtitle}
        profilePhone={profilePhone}
        t={t}
      />
    </ActionSheetThemed>
  );
}

const styles = StyleSheet.create({
  settingsFooter: {
    borderTopWidth: 1,
    ...HOME_FAST_BOOK_SHEET_FOOTER,
  },
});
