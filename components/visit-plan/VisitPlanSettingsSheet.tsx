import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';

import ActionSheetThemed from '@/components/ActionSheetThemed';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import { HOME_FAST_BOOK_OVERLAY, HOME_FAST_BOOK_SHEET_FOOTER, homeFastBookWhenPanelBg } from '@/components/home/fast-book/homeFastBookSheetUi';
import Switch from '@/components/forms/Switch';
import SurfaceCard from '@/components/layout/SurfaceCard';
import {
  ActionSheetNestedDock,
  ActionSheetStackScrim,
  actionSheetNestedStackStyles as stackStyles,
} from '@/components/shared/sheet/ActionSheetNestedDock';
import ThemedText from '@/components/ThemedText';
import VisitPlanSettingsIntervalPanel from '@/components/visit-plan/VisitPlanSettingsFieldSheet';
import { useAuth } from '@/contexts/AuthContext';
import { useVisitPlan } from '@/contexts/VisitPlanContext';
import useThemeColors from '@/contexts/ThemeColors';
import { useActionSheetVisible } from '@/hooks/useActionSheetVisible';
import { useTranslation } from '@/hooks/useTranslation';
import { formatVisitPlanIntervalEvery } from '@/utils/visitPlanIntervalDisplay';
import type { VisitPlanSaveOptions } from '@/utils/visitPlanCrmMapping';
import type { VisitPlanPreferences } from '@/utils/visitPlanTypes';

export type VisitPlanSettingsField = 'interval';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefs: VisitPlanPreferences;
  onSavePrefs: (next: VisitPlanPreferences, options?: VisitPlanSaveOptions) => Promise<boolean>;
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

function SettingsAlertsSection({
  draft,
  setDraft,
  onRemindersEdited,
  profilePhone,
  t,
}: {
  draft: VisitPlanPreferences;
  setDraft: (next: VisitPlanPreferences | ((current: VisitPlanPreferences) => VisitPlanPreferences)) => void;
  onRemindersEdited: () => void;
  profilePhone?: string | null;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const hasPhone = Boolean(profilePhone?.trim());
  const enabled = draft.remindersEnabled;
  const statusLabel = enabled ? t('visitPlanRemindersOn') : t('visitPlanRemindersOff');

  const onToggle = (next: boolean) => {
    if (next && !hasPhone) return;
    onRemindersEdited();
    setDraft((current) => ({ ...current, remindersEnabled: next }));
  };

  return (
    <>
      <View className="h-px bg-light-secondary dark:bg-dark-secondary" />
      <View className="px-4 pb-4 pt-3.5">
        <ThemedText className="text-sm font-semibold">{t('visitPlanSettingsRowReminders')}</ThemedText>
        <ThemedText className="mt-1 text-sm text-light-subtext dark:text-dark-subtext">
          {t('visitPlanSettingsRowRemindersPrompt')}
        </ThemedText>

        <View style={styles.alertsToggleRow}>
          <ThemedText className="text-base font-medium">{statusLabel}</ThemedText>
          <Switch
            value={enabled}
            onChange={onToggle}
            disabled={!hasPhone && !enabled}
            className="py-0"
            style={styles.alertsSwitch}
          />
        </View>

        {!hasPhone ? (
          <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
            {t('visitPlanSavePhoneRequired')}
          </ThemedText>
        ) : null}
      </View>
    </>
  );
}

function SettingsNavList({
  intervalTitle,
  intervalSubtitle,
  draft,
  setDraft,
  onRemindersEdited,
  profilePhone,
  onOpenInterval,
  t,
}: {
  intervalTitle: string;
  intervalSubtitle: string;
  draft: VisitPlanPreferences;
  setDraft: (next: VisitPlanPreferences | ((current: VisitPlanPreferences) => VisitPlanPreferences)) => void;
  onRemindersEdited: () => void;
  profilePhone?: string | null;
  onOpenInterval: () => void;
  t: ReturnType<typeof useTranslation>['t'];
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
        onPress={onOpenInterval}
      />
      <SettingsAlertsSection
        draft={draft}
        setDraft={setDraft}
        onRemindersEdited={onRemindersEdited}
        profilePhone={profilePhone}
        t={t}
      />
    </SurfaceCard>
  );
}

function SettingsMainPanel({
  draft,
  setDraft,
  saving,
  onSavePrefs,
  onOpenChange,
  onOpenInterval,
  onRemindersEdited,
  intervalSubtitle,
  profilePhone,
  t,
}: {
  draft: VisitPlanPreferences;
  setDraft: (next: VisitPlanPreferences | ((current: VisitPlanPreferences) => VisitPlanPreferences)) => void;
  onRemindersEdited: () => void;
  saving: boolean;
  onSavePrefs: (next: VisitPlanPreferences, options?: VisitPlanSaveOptions) => Promise<boolean>;
  onOpenChange: (open: boolean) => void;
  onOpenInterval: () => void;
  intervalSubtitle: string;
  profilePhone?: string | null;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const colors = useThemeColors();
  const hasPhone = Boolean(profilePhone?.trim());
  const saveDisabled = saving || (!hasPhone && draft.remindersEnabled);

  return (
    <View>
      <View className="px-global pt-2">
        <ThemedText className="mb-4 text-lg font-bold">{t('visitPlanSettingsHeading')}</ThemedText>

        <SettingsNavList
          intervalTitle={t('visitPlanSettingsRowInterval')}
          intervalSubtitle={intervalSubtitle}
          draft={draft}
          setDraft={setDraft}
          onRemindersEdited={onRemindersEdited}
          profilePhone={profilePhone}
          onOpenInterval={onOpenInterval}
          t={t}
        />
      </View>

      <View style={[styles.settingsFooter, { borderTopColor: colors.border }]}>
        <Button
          title={saving ? t('visitPlanLoading') : t('visitPlanSavePreferences')}
          variant="primary"
          size="medium"
          className="w-full py-4"
          disabled={saveDisabled}
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
  onOpenInterval,
  onRemindersEdited,
  intervalSubtitle,
  profilePhone,
  t,
}: {
  nestedField: VisitPlanSettingsField | null;
  dismissNested: () => void;
  draft: VisitPlanPreferences;
  setDraft: (next: VisitPlanPreferences | ((current: VisitPlanPreferences) => VisitPlanPreferences)) => void;
  onRemindersEdited: () => void;
  saving: boolean;
  onSavePrefs: (next: VisitPlanPreferences, options?: VisitPlanSaveOptions) => Promise<boolean>;
  onOpenChange: (open: boolean) => void;
  onOpenInterval: () => void;
  intervalSubtitle: string;
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
    const ok = await onSavePrefs(draft, { scope: 'intervalOnly' });
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
          setDraft={setDraft}
          saving={saving}
          onSavePrefs={onSavePrefs}
          onOpenChange={onOpenChange}
          onOpenInterval={onOpenInterval}
          onRemindersEdited={onRemindersEdited}
          intervalSubtitle={intervalSubtitle}
          profilePhone={profilePhone}
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
            <VisitPlanSettingsIntervalPanel
              prefs={draft}
              onChange={setDraft}
              saving={saving}
              onSave={() => void saveDraftFromNested()}
            />
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
  const { client } = useAuth();
  const { reload } = useVisitPlan();
  const profilePhone = client?.phone?.trim() || null;
  const [draft, setDraft] = useState(prefs);
  const [nestedField, setNestedField] = useState<VisitPlanSettingsField | null>(null);
  const remindersDraftBaselineRef = useRef<boolean | null>(null);
  const sheetOpenInitializedRef = useRef(false);
  const remindersUserEditedRef = useRef(false);

  const markRemindersEdited = useCallback(() => {
    remindersUserEditedRef.current = true;
  }, []);

  useEffect(() => {
    if (!open) {
      setNestedField(null);
      remindersDraftBaselineRef.current = null;
      sheetOpenInitializedRef.current = false;
      remindersUserEditedRef.current = false;
      return;
    }
    if (sheetOpenInitializedRef.current) return;
    sheetOpenInitializedRef.current = true;
    setDraft(prefs);
    remindersDraftBaselineRef.current = prefs.remindersEnabled;
    reload({ silent: true });
  }, [open, reload]);

  useEffect(() => {
    if (!open || remindersUserEditedRef.current) return;
    setDraft((current) => {
      if (current.remindersEnabled === prefs.remindersEnabled) return current;
      remindersDraftBaselineRef.current = prefs.remindersEnabled;
      return { ...current, remindersEnabled: prefs.remindersEnabled };
    });
  }, [open, prefs.remindersEnabled]);

  useEffect(() => {
    if (!open) return;
    setNestedField(initialField === 'interval' ? 'interval' : null);
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
        onOpenInterval={() => setNestedField('interval')}
        onRemindersEdited={markRemindersEdited}
        intervalSubtitle={intervalSubtitle}
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
  alertsToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    minHeight: 44,
  },
  alertsSwitch: {
    flexShrink: 0,
    alignSelf: 'center',
  },
});
