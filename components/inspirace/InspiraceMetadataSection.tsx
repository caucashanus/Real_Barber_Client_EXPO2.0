import React from 'react';
import { View } from 'react-native';

import BranchContentCardSection from '@/components/branch/BranchContentCardSection';
import ChoiceChipLabel from '@/components/ChoiceChipLabel';
import type { TranslationKey } from '@/locales';

const METADATA_PILL_SPACING_STYLE = { marginRight: 6, marginBottom: 6 } as const;

interface InspiraceMetadataSectionProps {
  faceShapeLabels: string[];
  hairTypeLabels: string[];
  hairPropertyLabels: string[];
  hairLengthLabels: string[];
  /** První metadata skupina v parent kartě — stejné `isFirst` jako u O účesu / Obtížnosti. */
  startIsFirst?: boolean;
  t: (key: TranslationKey) => string;
}

function MetadataPillGroup({
  title,
  labels,
  isFirst,
}: {
  title: string;
  labels: string[];
  isFirst: boolean;
}) {
  if (labels.length === 0) return null;

  return (
    <BranchContentCardSection title={title} isFirst={isFirst}>
      <View className="flex-row flex-wrap items-start">
        {labels.map((label) => (
          <View key={label} style={METADATA_PILL_SPACING_STYLE}>
            <ChoiceChipLabel label={label} compact />
          </View>
        ))}
      </View>
    </BranchContentCardSection>
  );
}

export default function InspiraceMetadataSection({
  faceShapeLabels,
  hairTypeLabels,
  hairPropertyLabels,
  hairLengthLabels,
  startIsFirst = false,
  t,
}: InspiraceMetadataSectionProps) {
  const groups = [
    { key: 'faceShapes', title: t('inspiraceDetailFaceShapes'), labels: faceShapeLabels },
    { key: 'hairTypes', title: t('inspiraceDetailHairTypes'), labels: hairTypeLabels },
    { key: 'hairProperties', title: t('inspiraceDetailHairProperties'), labels: hairPropertyLabels },
    { key: 'hairLengths', title: t('inspiraceDetailHairLengths'), labels: hairLengthLabels },
  ].filter((group) => group.labels.length > 0);

  if (groups.length === 0) return null;

  return (
    <>
      {groups.map((group, index) => (
        <MetadataPillGroup
          key={group.key}
          title={group.title}
          labels={group.labels}
          isFirst={startIsFirst && index === 0}
        />
      ))}
    </>
  );
}
