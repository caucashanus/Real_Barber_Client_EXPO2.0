import React, { useMemo } from 'react';
import { View } from 'react-native';

import BranchContentCardSection from '@/components/branch/BranchContentCardSection';
import CustomCard from '@/components/CustomCard';
import InspiraceDetailScoreMeter from '@/components/inspirace/InspiraceDetailScoreMeter';
import InspiraceMetadataSection from '@/components/inspirace/InspiraceMetadataSection';
import ThemedText from '@/components/ThemedText';
import type { HairstyleServiceDetail } from '@/utils/inspiraceServiceDetailHelpers';
import type { TranslationKey } from '@/locales';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';

interface HairstyleDetailContentCardProps {
  detail: HairstyleServiceDetail;
  t: (key: TranslationKey) => string;
}

type ContentBlock =
  | { key: 'about' | 'forWho' | 'difficulty'; kind: 'titled'; title: string }
  | { key: 'metadata'; kind: 'metadata' };

export default function HairstyleDetailContentCard({ detail, t }: HairstyleDetailContentCardProps) {
  const blocks = useMemo(() => {
    const items: ContentBlock[] = [];

    if (detail.description.trim()) {
      items.push({ key: 'about', kind: 'titled', title: t('inspiraceDetailAbout') });
    }

    if (detail.descriptionForWho.trim()) {
      items.push({ key: 'forWho', kind: 'titled', title: t('inspiraceDetailForWho') });
    }

    if (detail.stylingDifficulty != null && detail.stylingDifficulty >= 1) {
      items.push({
        key: 'difficulty',
        kind: 'titled',
        title: t('inspiraceDetailDifficulty'),
      });
    }

    const hasMetadata =
      detail.faceShapeLabels.length > 0 ||
      detail.hairTypeLabels.length > 0 ||
      detail.hairPropertyLabels.length > 0 ||
      detail.hairLengthLabels.length > 0;

    if (hasMetadata) {
      items.push({ key: 'metadata', kind: 'metadata' });
    }

    return items;
  }, [detail, t]);

  if (blocks.length === 0) return null;

  const renderBlockContent = (block: ContentBlock, isFirst: boolean) => {
    switch (block.key) {
      case 'about':
        return (
          <ThemedText className="text-sm leading-6 text-light-subtext dark:text-dark-subtext">
            {detail.description}
          </ThemedText>
        );
      case 'forWho':
        return (
          <ThemedText className="text-sm leading-6 text-light-subtext dark:text-dark-subtext">
            {detail.descriptionForWho}
          </ThemedText>
        );
      case 'difficulty':
        return (
          <InspiraceDetailScoreMeter
            value={detail.stylingDifficulty ?? 0}
            label={t('inspiraceDetailDifficulty')}
            showLabel={false}
          />
        );
      case 'metadata':
        return (
          <InspiraceMetadataSection
            faceShapeLabels={detail.faceShapeLabels}
            hairTypeLabels={detail.hairTypeLabels}
            hairPropertyLabels={detail.hairPropertyLabels}
            hairLengthLabels={detail.hairLengthLabels}
            startIsFirst={isFirst}
            t={t}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View className={BARBER_DETAIL_SECTION_SPACING}>
      <CustomCard
      rounded="2xl"
      padding="md"
      border
      background={false}
      className="bg-light-secondary dark:bg-dark-secondary">
      {blocks.map((block, index) => {
        const isFirst = index === 0;

        if (block.kind === 'metadata') {
          return (
            <React.Fragment key={block.key}>
              {renderBlockContent(block, isFirst)}
            </React.Fragment>
          );
        }

        const content = renderBlockContent(block, isFirst);

        if (block.kind === 'titled') {
          return (
            <BranchContentCardSection key={block.key} title={block.title} isFirst={isFirst}>
              {content}
            </BranchContentCardSection>
          );
        }

        return null;
      })}
      </CustomCard>
    </View>
  );
}
