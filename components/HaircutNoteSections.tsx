import React, { useMemo, useState } from 'react';
import { View, Image, Pressable } from 'react-native';
import Section from '@/components/layout/Section';
import Divider from '@/components/layout/Divider';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import {
  parseHaircutNoteLines,
  bucketHaircutNoteLines,
  HAIRCUT_NOTE_SECTION_ORDER,
  type HaircutNoteSectionId,
} from '@/utils/haircut-note';
import {
  resolveOverviewRowIcon,
  resolveAmenityIcon,
  resolvePropertyTypeIcon,
  resolveSeasonIcon,
  isLongerHaircutTypeLabel,
} from '@/utils/haircut-wizard-match';
import {
  findParsedLineIndex,
  removeFeatureTagFromNote,
  removeLineAt,
} from '@/utils/haircut-note-mutate';
import { useTranslation } from '@/app/hooks/useTranslation';
import type { TranslationKey } from '@/locales';
import HaircutNoteEditModals, { type HaircutNotePickerKind } from '@/components/HaircutNoteEditModals';

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
    <View className="relative rounded-xl bg-light-secondary dark:bg-dark-secondary p-3 mb-2 last:mb-0 flex-row items-center">
      <View className={`flex-1 min-w-0 ${editing && onRemove ? 'pr-10' : 'pr-2'}`}>
        {label ? (
          <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mb-1">{label}</ThemedText>
        ) : null}
        <ThemedText className="text-base font-medium text-light-text dark:text-dark-text">{value}</ThemedText>
      </View>
      {trailing}
      {editing && onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-red-500 items-center justify-center"
        >
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
            <View className="flex-row items-center rounded-full bg-light-secondary dark:bg-dark-secondary px-3 py-1.5 pr-8">
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
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 items-center justify-center"
              >
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
    <View className="flex-row flex-wrap gap-2">
      {tags.map((tag, i) => {
        const img = variant === 'type' ? resolvePropertyTypeIcon(tag) : resolveSeasonIcon(tag);
        const big = variant === 'type' && isLongerHaircutTypeLabel(tag);
        return (
          <View key={`${tag}-${i}`} className="relative">
            <View className="flex-row items-center rounded-full bg-light-secondary dark:bg-dark-secondary px-3 py-1.5 pr-8">
              {img ? (
                <Image
                  source={img}
                  className={big ? 'mr-1.5 h-7 w-7' : 'mr-1.5 h-6 w-6'}
                  resizeMode="contain"
                />
              ) : null}
              <ThemedText className="text-sm text-light-text dark:text-dark-text">{tag}</ThemedText>
            </View>
            {editing && onRemoveTag ? (
              <Pressable
                onPress={() => onRemoveTag(tag)}
                hitSlop={6}
                className="absolute -top-1 -right-1 h-6 w-6 items-center justify-center rounded-full bg-red-500"
              >
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
export default function HaircutNoteSections({ note, editing, onNoteChange }: HaircutNoteSectionsProps) {
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
        className="h-8 w-8 rounded-full bg-light-secondary dark:bg-dark-secondary items-center justify-center"
      >
        <Icon name="Plus" size={16} className="text-light-text dark:text-dark-text" />
      </Pressable>
    );
  };

  if (!note?.trim()) {
    if (!editNote) {
      return (
        <Section title={t('haircutDetailNoteTitle')} titleSize="lg" className="px-global pt-4">
          <View className="mt-4 bg-light-secondary dark:bg-dark-secondary rounded-xl p-4">
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
            {index > 0 ? <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" /> : null}
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
          <View className="mt-4 bg-light-secondary dark:bg-dark-secondary rounded-xl p-4 relative">
            {editNote ? (
              <Pressable
                onPress={() => applyNote('')}
                hitSlop={8}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 items-center justify-center z-10"
              >
                <Icon name="X" size={14} color="white" />
              </Pressable>
            ) : null}
            <ThemedText className="text-sm leading-6 text-light-text dark:text-dark-text pr-8">
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
          {index > 0 ? <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" /> : null}
          <Section
            title={t(SECTION_TITLE_KEY[sectionId])}
            titleSize="lg"
            className="px-global pt-4"
            titleTrailing={editNote ? sectionAddButton(sectionId) : undefined}
          >
            {buckets[sectionId].length === 0 ? null : (
            <View
              className={`gap-1 ${sectionId === 'overview' ? 'mt-5' : 'mt-4'}`}
            >
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
                          ? 'w-14 h-14 shrink-0 translate-y-3'
                          : 'w-12 h-12 shrink-0 translate-y-3'
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
                        <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mb-2">
                          {row.label}
                        </ThemedText>
                      ) : null}
                      <OverviewTagsBlock
                        value={row.value}
                        variant={row.label === typeLineLabel ? 'type' : 'season'}
                        editing={!!editNote}
                        onRemoveTag={
                          editNote
                            ? (tag) =>
                                applyNote(removeFeatureTagFromNote(note, tag, row.label))
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
                        <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mb-2">
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
                      className="bg-light-secondary dark:bg-dark-secondary rounded-xl p-4 relative"
                    >
                      {editNote ? (
                        <Pressable
                          onPress={() => removeRow(row)}
                          hitSlop={8}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 items-center justify-center z-10"
                        >
                          <Icon name="X" size={14} color="white" />
                        </Pressable>
                      ) : null}
                      {row.label ? (
                        <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mb-2">
                          {row.label}
                        </ThemedText>
                      ) : null}
                      <ThemedText className="text-sm leading-6 text-light-text dark:text-dark-text pr-8">
                        {row.value}
                      </ThemedText>
                    </View>
                  );
                }
                if (sectionId === 'difficulty') {
                  return (
                    <View
                      key={`${row.label}-${rowIndex}`}
                      className="relative flex-row items-center rounded-xl bg-light-secondary dark:bg-dark-secondary p-4 pr-12"
                    >
                      <View className="flex-1 min-w-0 flex-row items-center justify-between pr-2">
                        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext flex-1 pr-2">
                          {row.label}
                        </ThemedText>
                        <ThemedText className="text-xl font-bold text-light-text dark:text-dark-text shrink-0">
                          {row.value}
                        </ThemedText>
                      </View>
                      {editNote ? (
                        <Pressable
                          onPress={() => removeRow(row)}
                          hitSlop={8}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 items-center justify-center"
                        >
                          <Icon name="X" size={14} color="white" />
                        </Pressable>
                      ) : null}
                    </View>
                  );
                }
                if (sectionId === 'other' && !row.label) {
                  return (
                    <View key={`other-${rowIndex}`} className="flex-row items-start gap-2">
                      <Icon name="Circle" size={6} className="mt-2 text-light-subtext dark:text-dark-subtext" />
                      <ThemedText className="text-sm flex-1 text-light-text dark:text-dark-text">{row.value}</ThemedText>
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
