import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Image, Pressable, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import Selectable from '@/components/forms/Selectable';
import ThemedText from '@/components/ThemedText';
import { Chip } from '@/components/Chip';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import Input from '@/components/forms/Input';
import Counter from '@/components/forms/Counter';
import Section from '@/components/layout/Section';
import { useAccentColor } from '@/app/contexts/AccentColorContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import useThemeColors from '@/app/contexts/ThemeColors';
import {
  AMENITY_OPTIONS,
  GUEST_ACCESS_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
} from '@/constants/haircutWizardOptions';
import { matchesWizardLabel } from '@/utils/haircut-wizard-match';
import {
  getNoteLines,
  parseDescriptionFromNote,
  parseDifficultyPercent,
  parseMeasurementValues,
  removeLineWithLabel,
  upsertLabeledLine,
} from '@/utils/haircut-note-mutate';
import { stylingDifficultyLabel } from '@/utils/haircut-note-build';

export type HaircutNotePickerKind =
  | 'overview'
  | 'measurements'
  | 'features'
  | 'difficulty'
  | 'description'
  | null;

interface HaircutNoteEditModalsProps {
  kind: HaircutNotePickerKind;
  note: string;
  onClose: () => void;
  onApply: (nextNote: string) => void;
}

export default function HaircutNoteEditModals({ kind, note, onClose, onApply }: HaircutNoteEditModalsProps) {
  const { t } = useTranslation();
  const { accentColor } = useAccentColor();
  const colors = useThemeColors();
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const visible = kind != null;

  const [ears, setEars] = useState(0);
  const [top, setTop] = useState(0);
  const [weeks, setWeeks] = useState(4);
  const [amenitySel, setAmenitySel] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState(50);
  const [descDraft, setDescDraft] = useState('');

  const sheetTitle = useMemo(() => {
    if (!kind) return '';
    switch (kind) {
      case 'overview':
        return t('haircutNoteSectionOverview');
      case 'measurements':
        return t('haircutNoteSectionMeasurements');
      case 'features':
        return t('haircutNoteSectionFeatures');
      case 'difficulty':
        return t('haircutNoteSectionDifficulty');
      case 'description':
        return t('haircutNoteSectionDescription');
      default:
        return '';
    }
  }, [kind, t]);

  useEffect(() => {
    if (visible) {
      const id = requestAnimationFrame(() => actionSheetRef.current?.show());
      return () => cancelAnimationFrame(id);
    }
    actionSheetRef.current?.hide();
  }, [visible, kind]);

  useEffect(() => {
    if (!visible || !kind) return;
    if (kind === 'measurements') {
      const v = parseMeasurementValues(note, {
        ears: t('addPropertyLengthAtEars'),
        top: t('addPropertyLengthOnTop'),
        weeks: t('addPropertyHowOftenTrim'),
      });
      setEars(v.ears);
      setTop(v.top);
      setWeeks(v.weeks);
    }
    if (kind === 'difficulty') {
      setDifficulty(parseDifficultyPercent(note, t('addPropertyDifficulty')));
    }
    if (kind === 'description') {
      setDescDraft(parseDescriptionFromNote(note, t('addPropertyDescription')));
    }
    if (kind === 'features') {
      const prefix = `${t('addPropertyStepFeatures')}:`;
      const line = getNoteLines(note).find((l) => l.startsWith(prefix));
      const tags = line
        ? line
            .slice(prefix.length)
            .trim()
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const english: string[] = [];
      for (const tag of tags) {
        const opt = AMENITY_OPTIONS.find((a) => matchesWizardLabel(tag, a.labelKey));
        if (opt) english.push(opt.label);
      }
      setAmenitySel(english);
    }
  }, [visible, kind, note, t]);

  const applyMeasurements = () => {
    let next = note;
    next = upsertLabeledLine(next, t('addPropertyLengthAtEars'), `${ears} cm`);
    next = upsertLabeledLine(next, t('addPropertyLengthOnTop'), `${top} cm`);
    next = upsertLabeledLine(next, t('addPropertyHowOftenTrim'), `${weeks} ${t('addPropertyWeeksUnit')}`);
    onApply(next);
    onClose();
  };

  const applyFeatures = () => {
    const featuresLabel = t('addPropertyStepFeatures');
    if (amenitySel.length === 0) {
      onApply(removeLineWithLabel(note, featuresLabel));
    } else {
      const translated = amenitySel.map((label) => {
        const opt = AMENITY_OPTIONS.find((a) => a.label === label);
        return opt ? t(opt.labelKey) : label;
      });
      onApply(upsertLabeledLine(note, featuresLabel, translated.join(', ')));
    }
    onClose();
  };

  const applyDifficulty = () => {
    onApply(upsertLabeledLine(note, t('addPropertyDifficulty'), `${Math.round(difficulty)}%`));
    onClose();
  };

  const applyDescription = () => {
    const label = t('addPropertyDescription');
    const trimmed = descDraft.trim();
    if (!trimmed) {
      onApply(removeLineWithLabel(note, label));
    } else {
      onApply(upsertLabeledLine(note, label, trimmed));
    }
    onClose();
  };

  const pickType = (value: string) => {
    const opt = PROPERTY_TYPE_OPTIONS.find((o) => o.value === value);
    if (!opt) return;
    onApply(upsertLabeledLine(note, t('addPropertyStepHaircutType'), t(opt.labelKey)));
    onClose();
  };

  const pickSeason = (value: string) => {
    const opt = GUEST_ACCESS_OPTIONS.find((o) => o.value === value);
    if (!opt) return;
    onApply(upsertLabeledLine(note, t('addPropertyStepSeason'), t(opt.labelKey)));
    onClose();
  };

  const maxSheetScroll = Dimensions.get('window').height * 0.72;

  return (
    <ActionSheet
      ref={actionSheetRef}
      isModal
      onClose={onClose}
      gestureEnabled
      closable
      initialSnapIndex={1}
      snapPoints={[16, 92]}
      overdrawEnabled={false}
      containerStyle={{
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        backgroundColor: colors.bg,
      }}
      CustomHeaderComponent={
        <View className="w-full flex-row items-start justify-between px-2 pb-2 pt-1 mb-1">
          <View className="w-10" />
          <View className="flex-1 items-center px-1">
            <View className="w-14 h-2 mt-1 rounded-full bg-light-secondary dark:bg-dark-secondary" />
            <ThemedText className="font-bold mt-2 text-center" numberOfLines={2}>
              {sheetTitle}
            </ThemedText>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            className="w-10 items-center pt-1"
            accessibilityRole="button"
            accessibilityLabel={t('commonCancel')}
          >
            <Icon name="X" size={22} className="text-light-text dark:text-dark-text" />
          </Pressable>
        </View>
      }
    >
      <ScrollView
        style={{ maxHeight: maxSheetScroll }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        {kind === 'overview' ? (
          <>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mb-2">
              {t('addPropertyStepHaircutType')}
            </ThemedText>
            {PROPERTY_TYPE_OPTIONS.map((option) => (
              <Selectable
                key={option.value}
                title={t(option.labelKey)}
                customIcon={
                  option.iconImage != null ? (
                    <Image
                      source={option.iconImage}
                      className={option.value === 'delsi' ? 'w-14 h-14' : 'w-12 h-12'}
                      resizeMode="contain"
                    />
                  ) : undefined
                }
                onPress={() => pickType(option.value)}
              />
            ))}
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-6 mb-2">
              {t('addPropertyStepSeason')}
            </ThemedText>
            {GUEST_ACCESS_OPTIONS.map((option) => (
              <View key={option.value} className="mb-1">
                <Selectable
                  title={t(option.labelKey)}
                  description={t(option.descKey)}
                  customIcon={
                    option.iconImage != null ? (
                      <Image source={option.iconImage} className="w-12 h-12" resizeMode="contain" />
                    ) : undefined
                  }
                  onPress={() => pickSeason(option.value)}
                />
              </View>
            ))}
          </>
        ) : null}

        {kind === 'measurements' ? (
          <>
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1 pr-4">
                <ThemedText className="text-lg">{t('addPropertyLengthAtEars')}</ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  {t('addPropertyLengthCm')}
                </ThemedText>
              </View>
              <Counter value={ears} onChange={(v) => setEars(v ?? 0)} min={0} max={20} />
            </View>
            <View className="flex-row items-center justify-between py-3 border-t border-light-secondary dark:border-dark-secondary">
              <View className="flex-1 pr-4">
                <ThemedText className="text-lg">{t('addPropertyLengthOnTop')}</ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  {t('addPropertyLengthCm')}
                </ThemedText>
              </View>
              <Counter value={top} onChange={(v) => setTop(v ?? 0)} min={0} max={20} />
            </View>
            <View className="flex-row items-center justify-between py-3 border-t border-light-secondary dark:border-dark-secondary">
              <View className="flex-1 pr-4">
                <ThemedText className="text-lg">{t('addPropertyHowOftenTrim')}</ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  {t('addPropertyWeeksToComeIn')}
                </ThemedText>
              </View>
              <Counter value={weeks} onChange={(v) => setWeeks(v ?? 4)} min={1} max={24} />
            </View>
            <Button title={t('commonSave')} onPress={applyMeasurements} className="mt-6" />
          </>
        ) : null}

        {kind === 'features' ? (
          <>
            <View className="flex-row flex-wrap gap-3">
              {AMENITY_OPTIONS.map((amenity) => (
                <Chip
                  size="lg"
                  key={amenity.label}
                  label={t(amenity.labelKey)}
                  icon={amenity.icon}
                  isSelected={amenitySel.includes(amenity.label)}
                  onPress={() => {
                    setAmenitySel((prev) =>
                      prev.includes(amenity.label)
                        ? prev.filter((a) => a !== amenity.label)
                        : [...prev, amenity.label]
                    );
                  }}
                />
              ))}
            </View>
            <Button title={t('commonSave')} onPress={applyFeatures} className="mt-8 mb-2" />
          </>
        ) : null}

        {kind === 'difficulty' ? (
          <>
            <Section title={t('addPropertyDifficulty')} titleSize="md" padding="sm">
              <Slider
                style={{ width: '100%', height: 40 }}
                value={difficulty}
                minimumValue={0}
                maximumValue={100}
                onValueChange={(v) => setDifficulty(v)}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor="rgba(0,0,0,0.2)"
                thumbTintColor={accentColor}
                step={1}
              />
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-1">
                {stylingDifficultyLabel(difficulty)}
              </ThemedText>
            </Section>
            <Button title={t('commonSave')} onPress={applyDifficulty} className="mt-6" />
          </>
        ) : null}

        {kind === 'description' ? (
          <>
            <Input
              label={t('addPropertyDescription')}
              value={descDraft}
              onChangeText={setDescDraft}
              isMultiline
              maxLength={500}
              containerClassName="mb-4"
            />
            <Button title={t('commonSave')} onPress={applyDescription} />
          </>
        ) : null}
      </ScrollView>
    </ActionSheet>
  );
}
