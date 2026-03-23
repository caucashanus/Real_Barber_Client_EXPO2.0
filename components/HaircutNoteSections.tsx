import React, { useMemo } from 'react';
import { View, Image } from 'react-native';
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
  isLongerHaircutTypeLabel,
} from '@/utils/haircut-wizard-match';
import { useTranslation } from '@/app/hooks/useTranslation';
import type { TranslationKey } from '@/locales';

const SECTION_TITLE_KEY: Record<HaircutNoteSectionId, TranslationKey> = {
  overview: 'haircutNoteSectionOverview',
  measurements: 'haircutNoteSectionMeasurements',
  features: 'haircutNoteSectionFeatures',
  difficulty: 'haircutNoteSectionDifficulty',
  description: 'haircutNoteSectionDescription',
  other: 'haircutNoteSectionOther',
};

function NoteRow({
  label,
  value,
  trailing,
}: {
  label: string;
  value: string;
  trailing?: React.ReactNode;
}) {
  return (
    <View className="rounded-xl bg-light-secondary dark:bg-dark-secondary p-3 mb-2 last:mb-0 flex-row items-center">
      <View className="flex-1 min-w-0 pr-2">
        {label ? (
          <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mb-1">{label}</ThemedText>
        ) : null}
        <ThemedText className="text-base font-medium text-light-text dark:text-dark-text">{value}</ThemedText>
      </View>
      {trailing}
    </View>
  );
}

function FeaturesBlock({ value }: { value: string }) {
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
          <View
            key={`${tag}-${i}`}
            className="flex-row items-center rounded-full bg-light-secondary dark:bg-dark-secondary px-3 py-1.5"
          >
            {amenityIcon ? (
              <Icon
                name={amenityIcon}
                size={16}
                className="mr-1.5 text-light-text dark:text-dark-text"
              />
            ) : null}
            <ThemedText className="text-sm text-light-text dark:text-dark-text">{tag}</ThemedText>
          </View>
        );
      })}
    </View>
  );
}

interface HaircutNoteSectionsProps {
  note: string | null | undefined;
}

/**
 * Rozparsuje strukturovaný text z API (`Typ účesu: …\\nObdobí: …`) do sekcí.
 */
export default function HaircutNoteSections({ note }: HaircutNoteSectionsProps) {
  const { t } = useTranslation();

  const { buckets, hasStructured } = useMemo(() => {
    const parsed = parseHaircutNoteLines(note);
    const b = bucketHaircutNoteLines(parsed);
    const structured = parsed.some((l) => l.label.length > 0);
    return { buckets: b, hasStructured: structured };
  }, [note]);

  if (!note?.trim()) {
    return (
      <Section title={t('haircutDetailNoteTitle')} titleSize="lg" className="px-global pt-4">
        <View className="mt-4 bg-light-secondary dark:bg-dark-secondary rounded-xl p-4">
          <ThemedText className="text-sm text-light-text dark:text-dark-text">—</ThemedText>
        </View>
      </Section>
    );
  }

  if (!hasStructured) {
    return (
      <Section title={t('haircutDetailNoteTitle')} titleSize="lg" className="px-global pt-4">
        <View className="mt-4 bg-light-secondary dark:bg-dark-secondary rounded-xl p-4">
          <ThemedText className="text-sm leading-6 text-light-text dark:text-dark-text">{note.trim()}</ThemedText>
        </View>
      </Section>
    );
  }

  const sections = HAIRCUT_NOTE_SECTION_ORDER.filter((id) => buckets[id].length > 0);

  return (
    <>
      {sections.map((sectionId, index) => (
        <React.Fragment key={sectionId}>
          {index > 0 ? <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" /> : null}
          <Section title={t(SECTION_TITLE_KEY[sectionId])} titleSize="lg" className="px-global pt-4">
            <View className="mt-4 gap-1">
              {buckets[sectionId].map((row, rowIndex) => {
                const overviewIcon =
                  sectionId === 'overview' ? resolveOverviewRowIcon(row.value) : undefined;
                const overviewTrailing =
                  overviewIcon != null ? (
                    <Image
                      source={overviewIcon}
                      className={
                        isLongerHaircutTypeLabel(row.value)
                          ? 'w-14 h-14 shrink-0 translate-y-3'
                          : 'w-12 h-12 shrink-0 translate-y-3'
                      }
                      resizeMode="contain"
                    />
                  ) : undefined;

                if (sectionId === 'features') {
                  return (
                    <View key={`${row.label}-${rowIndex}`} className="mb-2">
                      {row.label ? (
                        <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mb-2">
                          {row.label}
                        </ThemedText>
                      ) : null}
                      <FeaturesBlock value={row.value} />
                    </View>
                  );
                }
                if (sectionId === 'description') {
                  return (
                    <View
                      key={`${row.label}-${rowIndex}`}
                      className="bg-light-secondary dark:bg-dark-secondary rounded-xl p-4"
                    >
                      {row.label ? (
                        <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mb-2">
                          {row.label}
                        </ThemedText>
                      ) : null}
                      <ThemedText className="text-sm leading-6 text-light-text dark:text-dark-text">
                        {row.value}
                      </ThemedText>
                    </View>
                  );
                }
                if (sectionId === 'difficulty') {
                  return (
                    <View
                      key={`${row.label}-${rowIndex}`}
                      className="flex-row items-center justify-between rounded-xl bg-light-secondary dark:bg-dark-secondary p-4"
                    >
                      <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext flex-1 pr-2">
                        {row.label}
                      </ThemedText>
                      <ThemedText className="text-xl font-bold text-light-text dark:text-dark-text">
                        {row.value}
                      </ThemedText>
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
                  />
                );
              })}
            </View>
          </Section>
        </React.Fragment>
      ))}
    </>
  );
}
