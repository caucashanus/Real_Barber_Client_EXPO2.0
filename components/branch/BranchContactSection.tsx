import React from 'react';
import { Pressable, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { useCopyFeedback } from '@/contexts/CopyFeedbackContext';
import AppButton from '@/components/AppButton';
import BranchOpenStatusRow from '@/components/branch/BranchOpenStatusRow';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { BARBER_DETAIL_SECTION_SPACING } from '@/constants/barberDetailLayout';
import type { BranchContactMeta } from '@/constants/branchContacts';
import type { TranslationKey } from '@/locales';
import { openBranchMapsApp } from '@/utils/branchDetailHelpers';

interface BranchContactSectionProps {
  branchMeta: BranchContactMeta;
  mapWidth: number;
  mapHeight: number;
  onScrollToInterior?: () => void;
  onOpenNavigate: () => void;
  onOpenCallUs: () => void;
  t: (key: TranslationKey) => string;
}

export default function BranchContactSection({
  branchMeta,
  mapWidth,
  mapHeight,
  onScrollToInterior,
  onOpenNavigate,
  onOpenCallUs,
  t,
}: BranchContactSectionProps) {
  const { copyToClipboard } = useCopyFeedback();

  const openMaps = () => {
    openBranchMapsApp(branchMeta.shortLabel, {
      address: branchMeta.address,
      latitude: branchMeta.latitude,
      longitude: branchMeta.longitude,
    });
  };

  return (
    <>
      <View className="mb-4">
        <Pressable
          onPress={() => copyToClipboard(branchMeta.address)}
          className="flex-row items-center gap-1.5 self-start active:opacity-70">
          <ThemedText className="text-sm leading-5 text-light-subtext dark:text-dark-subtext">
            {branchMeta.address}
          </ThemedText>
          <Icon
            name="Copy"
            size={12}
            className="shrink-0 text-light-subtext dark:text-dark-subtext"
          />
        </Pressable>

        <View className="mt-4">
          <BranchOpenStatusRow t={t} variant="branch" />
        </View>
      </View>

      <View className={BARBER_DETAIL_SECTION_SPACING}>
        <View className="mb-4">
          <View
            className="w-full overflow-hidden rounded-xl bg-black"
            style={{ width: mapWidth, height: mapHeight }}>
            <Pressable
              onPress={openMaps}
              accessibilityRole="button"
              className="active:opacity-90"
              style={{ width: mapWidth, height: mapHeight }}>
              <MapView
                style={{ width: mapWidth, height: mapHeight }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                initialRegion={{
                  latitude: branchMeta.latitude,
                  longitude: branchMeta.longitude,
                  latitudeDelta: 0.012,
                  longitudeDelta: 0.012,
                }}>
                <Marker
                  coordinate={{
                    latitude: branchMeta.latitude,
                    longitude: branchMeta.longitude,
                  }}
                  title={branchMeta.shortLabel}
                />
              </MapView>
            </Pressable>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {onScrollToInterior ? (
            <AppButton
              title={t('branchInteriorTitle')}
              variant="outline"
              size="sm"
              rounded="full"
              className="px-3 py-2"
              iconStart="Images"
              iconSize={14}
              textClassName="text-xs font-semibold"
              onPress={onScrollToInterior}
            />
          ) : null}
          <AppButton
            title={t('branchNavigateSectionTitle')}
            variant="outline"
            size="sm"
            rounded="full"
            className="px-3 py-2"
            iconStart="Navigation"
            iconSize={14}
            textClassName="text-xs font-semibold"
            onPress={onOpenNavigate}
          />
          <AppButton
            title={t('barberPhoneCall')}
            variant="outline"
            size="sm"
            rounded="full"
            className="px-3 py-2"
            iconStart="Phone"
            iconSize={14}
            textClassName="text-xs font-semibold"
            onPress={onOpenCallUs}
          />
        </View>
      </View>
    </>
  );
}
