import { Image } from 'expo-image';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import type { ReservationCreateStepProps } from './types';

import ActionSheetThemed from '@/components/ActionSheetThemed';
import { Button } from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import VideoPlayer from '@/components/VideoPlayer';

export default function ReservationDetailSheets({ flow }: ReservationCreateStepProps) {
  const { t } = flow;

  return (
    <>
      <ActionSheetThemed ref={flow.detailsSheetRef} gestureEnabled>
        <ScrollView
          className="max-h-[75vh]"
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <ThemedText variant="h4" className="mb-2 mt-2 text-left">
            {flow.detailsEmployee?.name ?? t('sheetSpecialistFallback')}
          </ThemedText>
          <ThemedText className="mb-5 text-sm text-light-subtext dark:text-dark-subtext">
            {flow.detailsDescription || t('sheetNoBio')}
          </ThemedText>
          {flow.detailsMedia.length > 0 ? (
            <View className="mb-5">
              <ThemedText variant="label" className="mb-2">{t('sheetPortfolio')}</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}>
                {flow.detailsMedia.map((m, index) => (
                  <View
                    key={`${m.url}-${index}`}
                    className="h-24 w-24 overflow-hidden rounded-xl bg-light-secondary dark:bg-dark-secondary">
                    <Image source={{ uri: m.url }} className="h-full w-full" contentFit="cover" />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
          <Button title={t('sheetClose')} variant="outline" onPress={flow.closeEmployeeDetails} />
        </ScrollView>
      </ActionSheetThemed>

      <ActionSheetThemed ref={flow.branchDetailsSheetRef} gestureEnabled>
        <ScrollView
          className="max-h-[75vh]"
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <ThemedText variant="h4" className="mb-2 mt-2 text-left">
            {flow.detailsBranch?.name ?? t('sheetBranchFallback')}
          </ThemedText>
          <ThemedText
            numberOfLines={flow.isBranchDescriptionExpanded ? undefined : 3}
            className="mb-2 text-sm leading-6 text-light-subtext dark:text-dark-subtext">
            {flow.detailsBranchDescription || t('sheetBranchNoIntro')}
          </ThemedText>
          {flow.detailsBranchDescription ? (
            <Pressable
              className="mb-4 self-start rounded-full bg-light-secondary px-2 py-1 dark:bg-dark-secondary"
              onPress={() => flow.setIsBranchDescriptionExpanded((prev) => !prev)}>
              <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                {flow.isBranchDescriptionExpanded
                  ? t('sheetHideDescription')
                  : t('sheetShowFullDescription')}
              </ThemedText>
            </Pressable>
          ) : (
            <View className="mb-2" />
          )}
          {flow.detailsBranchVideo ? (
            <View className="mb-4 overflow-hidden rounded-xl bg-black">
              <ThemedText variant="label">{t('sheetHowToBranch')}</ThemedText>
              <VideoPlayer
                uri={flow.detailsBranchVideo.url}
                style={{ width: '100%', height: 220 }}
                contentFit="cover"
                nativeControls
                shouldPlay
                isLooping
                isMuted
              />
            </View>
          ) : null}
          {flow.detailsBranchImages.length > 0 ? (
            <View className="mb-5">
              <ThemedText variant="bodySm" className="mb-2">
                {t('sheetBranchInterior')}
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}>
                {flow.detailsBranchImages.map((m, index) => (
                  <View
                    key={`${m.url}-${index}`}
                    className="h-24 w-24 overflow-hidden rounded-xl bg-light-secondary dark:bg-dark-secondary">
                    <Image source={{ uri: m.url }} className="h-full w-full" contentFit="cover" />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
          <Button title={t('sheetClose')} variant="outline" onPress={flow.closeBranchDetails} />
        </ScrollView>
      </ActionSheetThemed>
    </>
  );
}