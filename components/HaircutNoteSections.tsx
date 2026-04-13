import React, { useMemo, useState } from 'react';
import { View, Image, Pressable } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import HaircutNoteEditModals, {
  type HaircutNotePickerKind,
} from '@/components/HaircutNoteEditModals';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import Selectable from '@/components/forms/Selectable';
import Divider from '@/components/layout/Divider';
import Section from '@/components/layout/Section';
import type { TranslationKey } from '@/locales';
import {
  parseHaircutNoteLines,
  bucketHaircutNoteLines,
  HAIRCUT_NOTE_SECTION_ORDER,
  type HaircutNoteSectionId,
} from '@/utils/haircut-note';
import {
  findParsedLineIndex,
  removeFeatureTagFromNote,
  removeLineAt,
} from '@/utils/haircut-note-mutate';
import {
  resolveOverviewRowIcon,
  resolveAmenityIcon,
  resolvePropertyTypeIcon,
  resolveSeasonIcon,
  isLongerHaircutTypeLabel,
} from '@/utils/haircut-wizard-match';

const SECTION_TITLE_KEY: Record<HaircutNoteSectionId, TranslationKey> = {
  overview: 'haircutNoteSectionOverview',
  measurements: 'haircutNoteSectionMeasurements',
  features: 'haircutNoteSectionFeatures',
  difficulty: 'haircutNoteSectionDifficulty',
  description: 'haircutNoteSectionDescription',
  other: 'haircutNoteSectionOther',
};

const PICKER_BY_SECTION: Record<HaircutNoteSectionId, HaircutNotePickerKind> = {
  overview: 'overview',
  measurements: 'measurements',
  features: 'features',
  difficulty: 'difficulty',
  description: 'description',
  other: null,
};

function NoteRow({
  label,
  value,
  trailing,
  editing,
  onRemove,
}: {
  label: string;
  value: string;
  trailing?: React.ReactNode;
  editing?: boolean;
  onRemove?: () => void;
}) {
  return (
    <View className="relative mb-2 flex-row items-center rounded-xl bg-light-secondary p-3 last:mb-0 dark:bg-dark-secondary">
      <View className={`min-w-0 flex-1 ${editing && onRemove ? 'pr-10' : 'pr-2'}`}>
        {label ? (
          <ThemedText className="mb-1 text-xs text-light-subtext dark:text-dark-subtext">
            {label}
          </ThemedText>
        ) : null}
        <ThemedText className="text-base font-medium text-light-text dark:text-dark-text">
          {value}
        </ThemedText>
      </View>
      {trailing}
      {editing && onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          className="absolute -right-1 -top-1 h-7 w-7 items-center justify-center rounded-full bg-red-500">
          <Icon name="X" size={14} color="white" />
        </Pressable>
      ) : null}
    </View>
  );
}

function FeaturesBlock({
  value,
  editing,
  onRemoveTag,
}: {
  value: string;
  editing?: boolean;
  onRemoveTag?: (tag: string) => void;
}) {
  const tags = useMemo(
    () =>
      value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [value]
  );
  if (tags.length === 0) return <NoteRow label="" value={value} />;
  return (
    <View className="flex-row flex-wrap gap-2">
      {tags.map((tag, i) => {
        const amenityIcon = resolveAmenityIcon(tag);
        return (
          <View key={`${tag}-${i}`} className="relative">
            <View className="flex-row items-center rounded-full bg-light-secondary px-3 py-1.5 pr-8 dark:bg-dark-secondary">
              {amenityIcon ? (
                <Icon
                  name={amenityIcon}
                  size={16}
                  className="mr-1.5 text-light-text dark:text-dark-text"
                />
              ) : null}
              <ThemedText className="text-sm text-light-text dark:text-dark-text">{tag}</ThemedText>
            </View>
            {editing && onRemoveTag ? (
              <Pressable
                onPress={() => onRemoveTag(tag)}
                hitSlop={6}
                className="absolute -right-1 -top-1 h-6 w-6 items-center justify-center rounded-full bg-red-500">
                <Icon name="X" size={12} color="white" />
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function OverviewTagsBlock({
  value,
  variant,
  editing,
  onRemoveTag,
}: {
  value: string;
  variant: 'type' | 'season';
  editing?: boolean;
  onRemoveTag?: (tag: string) => void;
}) {
  const tags = useMemo(
    () =>
      value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [value]
  );
  if (tags.length === 0) {
    return <NoteRow label="" value={value} />;
  }
  return (
    <View>
      {tags.map((tag, i) => {
        const img = variant === 'type' ? resolvePropertyTypeIcon(tag) : resolveSeasonIcon(tag);
        return (
          <View key={`${tag}-${i}`} className="relative">
            <Selectable
              title={tag}
              selected
              showSelectedIndicator={!editing}
              customIcon={
                img ? <Image source={img} className="h-12 w-12" resizeMode="contain" /> : undefined
              }
            />
            {editing && onRemoveTag ? (
              <Pressable
                onPress={() => onRemoveTag(tag)}
                hitSlop={6}
                className="absolute -right-1 -top-1 z-10 h-7 w-7 items-center justify-center rounded-full bg-red-500">
                <Icon name="X" size={12} color="white" />
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

interface HaircutNoteSectionsProps {
  note: string | null | undefined;
  editing?: boolean;
  onNoteChange?: (next: string) => void;
}

/**
 * Rozparsuje strukturovaný text z API (`Typ účesu: …\\nObdobí: …`) do sekcí.
 */
export default function HaircutNoteSections({
  note,
  editing,
  onNoteChange,
}: HaircutNoteSectionsProps) {
  const { t } = useTranslation();
  const [pickerKind, setPickerKind] = useState<HaircutNotePickerKind>(null);

  const editNote = editing && onNoteChange;

  const { buckets, hasStructured, parsed } = useMemo(() => {
    const p = parseHaircutNoteLines(note);
    const b = bucketHaircutNoteLines(p);
    const structured = p.some((l) => l.label.length > 0);
    return { buckets: b, hasStructured: structured, parsed: p };
  }, [note]);

  const sectionOrderList = useMemo(() => {
    if (editNote && hasStructured) {
      return HAIRCUT_NOTE_SECTION_ORDER.filter((id) => id !== 'other');
    }
    return HAIRCUT_NOTE_SECTION_ORDER.filter((id) => buckets[id].length > 0);
  }, [editNote, hasStructured, buckets]);

  const applyNote = (next: string) => {
    onNoteChange?.(next);
  };

  const removeRow = (row: { label: string; value: string }) => {
    if (!note || !editNote) return;
    const idx = findParsedLineIndex(parsed, row);
    if (idx < 0) return;
    applyNote(removeLineAt(note, idx));
  };

  const typeLineLabel = t('addPropertyStepHaircutType');
  const seasonLineLabel = t('addPropertyStepSeason');

  const sectionAddButton = (sectionId: HaircutNoteSectionId) => {
    if (!editNote || sectionId === 'other') return null;
    const kind = PICKER_BY_SECTION[sectionId];
    if (!kind) return null;
    return (
      <Pressable
        onPress={() => setPickerKind(kind)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="h-8 w-8 items-center justify-center rounded-full bg-light-secondary dark:bg-dark-secondary">
        <Icon name="Plus" size={16} className="text-light-text dark:text-dark-text" />
      </Pressable>
    );
  };

  if (!note?.trim()) {
    if (!editNote) {
      return (
        <Section title={t('haircutDetailNoteTitle')} titleSize="lg" className="px-global pt-4">
          <View className="mt-4 rounded-xl bg-light-secondary p-4 dark:bg-dark-secondary">
            <ThemedText className="text-sm text-light-text dark:text-dark-text">—</ThemedText>
          </View>
        </Section>
      );
    }
    return (
      <>
        <HaircutNoteEditModals
          kind={pickerKind}
          note={note ?? ''}
          onClose={() => setPickerKind(null)}
          onApply={(next) => applyNote(next)}
        />
        {HAIRCUT_NOTE_SECTION_ORDER.filter((id) => id !== 'other').map((sectionId, index) => (
          <React.Fragment key={sectionId}>
            {index > 0 ? (
              <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />
            ) : null}
            <Section
              title={t(SECTION_TITLE_KEY[sectionId])}
              titleSize="lg"
              className="px-global pt-4"
              titleTrailing={sectionAddButton(sectionId)}
            />
          </React.Fragment>
        ))}
      </>
    );
  }

  if (!hasStructured) {
    return (
      <>
        <HaircutNoteEditModals
          kind={pickerKind}
          note={note}
          onClose={() => setPickerKind(null)}
          onApply={(next) => applyNote(next)}
        />
        <Section title={t('haircutDetailNoteTitle')} titleSize="lg" className="px-global pt-4">
          <View className="relative mt-4 rounded-xl bg-light-secondary p-4 dark:bg-dark-secondary">
            {editNote ? (
              <Pressable
                onPress={() => applyNote('')}
                hitSlop={8}
                className="absolute right-2 top-2 z-10 h-7 w-7 items-center justify-center rounded-full bg-red-500">
                <Icon name="X" size={14} color="white" />
              </Pressable>
            ) : null}
            <ThemedText className="pr-8 text-sm leading-6 text-light-text dark:text-dark-text">
              {note.trim()}
            </ThemedText>
          </View>
        </Section>
      </>
    );
  }

  return (
    <>
      <HaircutNoteEditModals
        kind={pickerKind}
        note={note}
        onClose={() => setPickerKind(null)}
        onApply={(next) => applyNote(next)}
      />
      {sectionOrderList.map((sectionId, index) => (
        <React.Fragment key={sectionId}>
          {index > 0 ? (
            <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />
          ) : null}
          <Section
            title={t(SECTION_TITLE_KEY[sectionId])}
            titleSize="lg"
            className="px-global pt-4"
            titleTrailing={editNote ? sectionAddButton(sectionId) : undefined}>
            {buckets[sectionId].length === 0 ? null : (
              <View className={`gap-1 ${sectionId === 'overview' ? 'mt-5' : 'mt-4'}`}>
                {buckets[sectionId].map((row, rowIndex) => {
                  const firstOverviewTag =
                    sectionId === 'overview'
                      ? row.value.split(',')[0]?.trim() || row.value
                      : row.value;
                  const overviewIcon =
                    sectionId === 'overview' ? resolveOverviewRowIcon(firstOverviewTag) : undefined;
                  const overviewTrailing =
                    overviewIcon != null ? (
                      <Image
                        source={overviewIcon}
                        className={
                          isLongerHaircutTypeLabel(firstOverviewTag)
                            ? 'h-14 w-14 shrink-0 translate-y-3'
                            : 'h-12 w-12 shrink-0 translate-y-3'
                        }
                        resizeMode="contain"
                      />
                    ) : undefined;

                  if (
                    sectionId === 'overview' &&
                    (row.label === typeLineLabel || row.label === seasonLineLabel)
                  ) {
                    return (
                      <View key={`${row.label}-${rowIndex}`} className="mb-2">
                        {row.label ? (
                          <ThemedText className="mb-2 text-xs text-light-subtext dark:text-dark-subtext">
                            {row.label}
                          </ThemedText>
                        ) : null}
                        <OverviewTagsBlock
                          value={row.value}
                          variant={row.label === typeLineLabel ? 'type' : 'season'}
                          editing={!!editNote}
                          onRemoveTag={
                            editNote
                              ? (tag) => applyNote(removeFeatureTagFromNote(note, tag, row.label))
                              : undefined
                          }
                        />
                      </View>
                    );
                  }

                  if (sectionId === 'features') {
                    return (
                      <View key={`${row.label}-${rowIndex}`} className="mb-2">
                        {row.label ? (
                          <ThemedText className="mb-2 text-xs text-light-subtext dark:text-dark-subtext">
                            {row.label}
                          </ThemedText>
                        ) : null}
                        <FeaturesBlock
                          value={row.value}
                          editing={!!editNote}
                          onRemoveTag={
                            editNote
                              ? (tag) =>
                                  applyNote(
                                    removeFeatureTagFromNote(
                                      note,
                                      tag,
                                      row.label || t('addPropertyStepFeatures')
                                    )
                                  )
                              : undefined
                          }
                        />
                      </View>
                    );
                  }
                  if (sectionId === 'description') {
                    return (
                      <View
                        key={`${row.label}-${rowIndex}`}
                        className="relative rounded-xl bg-light-secondary p-4 dark:bg-dark-secondary">
                        {editNote ? (
                          <Pressable
                            onPress={() => removeRow(row)}
                            hitSlop={8}
                            className="absolute right-2 top-2 z-10 h-7 w-7 items-center justify-center rounded-full bg-red-500">
                            <Icon name="X" size={14} color="white" />
                          </Pressable>
                        ) : null}
                        {row.label ? (
                          <ThemedText className="mb-2 text-xs text-light-subtext dark:text-dark-subtext">
                            {row.label}
                          </ThemedText>
                        ) : null}
                        <ThemedText className="pr-8 text-sm leading-6 text-light-text dark:text-dark-text">
                          {row.value}
                        </ThemedText>
                      </View>
                    );
                  }
                  if (sectionId === 'difficulty') {
                    return (
                      <View
                        key={`${row.label}-${rowIndex}`}
                        className="relative flex-row items-center rounded-xl bg-light-secondary p-4 pr-12 dark:bg-dark-secondary">
                        <View className="min-w-0 flex-1 flex-row items-center justify-between pr-2">
                          <ThemedText className="flex-1 pr-2 text-sm text-light-subtext dark:text-dark-subtext">
                            {row.label}
                          </ThemedText>
                          <ThemedText className="shrink-0 text-xl font-bold text-light-text dark:text-dark-text">
                            {row.value}
                          </ThemedText>
                        </View>
                        {editNote ? (
                          <Pressable
                            onPress={() => removeRow(row)}
                            hitSlop={8}
                            className="absolute right-2 top-2 h-7 w-7 items-center justify-center rounded-full bg-red-500">
                            <Icon name="X" size={14} color="white" />
                          </Pressable>
                        ) : null}
                      </View>
                    );
                  }
                  if (sectionId === 'other' && !row.label) {
                    return (
                      <View key={`other-${rowIndex}`} className="flex-row items-start gap-2">
                        <Icon
                          name="Circle"
                          size={6}
                          className="mt-2 text-light-subtext dark:text-dark-subtext"
                        />
                        <ThemedText className="flex-1 text-sm text-light-text dark:text-dark-text">
                          {row.value}
                        </ThemedText>
                      </View>
                    );
                  }
                  return (
                    <NoteRow
                      key={`${row.label}-${rowIndex}`}
                      label={row.label}
                      value={row.value}
                      trailing={overviewTrailing}
                      editing={!!editNote}
                      onRemove={editNote ? () => removeRow(row) : undefined}
                    />
                  );
                })}
              </View>
            )}
          </Section>
        </React.Fragment>
      ))}
    </>
  );
}
