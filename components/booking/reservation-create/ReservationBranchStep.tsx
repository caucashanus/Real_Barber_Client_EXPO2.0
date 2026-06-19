import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import type { ReservationCreateStepProps } from './types';

import Avatar from '@/components/Avatar';
import { Button } from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import Selectable from '@/components/forms/Selectable';
import { getBranchImageUrl } from '@/utils/reservationCreateHelpers';

export default function ReservationBranchStep({ flow }: ReservationCreateStepProps) {
  const { t } = flow;

  return (
    <ScrollView className="px-6 pb-4 pt-2">
      <View className="mb-3 items-center">
        <Image
          source={require('@/assets/img/reservation-branch.png')}
          className="h-16 w-16"
          style={{ width: 64, height: 64 }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
      <View className="mb-5">
        <ThemedText variant="h2">
          {t('reservationStepBranchTitle')}
        </ThemedText>
        <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
          {t('reservationStepBranchSubtitle')}
        </ThemedText>
        <Button
          title={t('reservationShowMap')}
          variant="outline"
          size="small"
          rounded="full"
          className="mt-2 self-center px-4"
          href="/screens/map"
        />
      </View>
      {flow.loadingBranches ? (
        <View className="items-center py-10">
          <ActivityIndicator size="small" />
        </View>
      ) : (
        flow.branchesForReservation.map((branch) => {
          const branchThumb = getBranchImageUrl(branch);
          return (
            <View key={branch.id} className="mb-2">
              <Selectable
                title={branch.name}
                description={branch.address ?? ''}
                customIcon={
                  branchThumb ? (
                    <Image
                      source={{ uri: branchThumb }}
                      className="h-12 w-12 rounded-xl"
                      contentFit="cover"
                    />
                  ) : (
                    <Avatar size="sm" name={branch.name} />
                  )
                }
                className="relative"
                selected={flow.data.branchId === branch.id}
                showSelectedIndicator={false}
                onPress={() => flow.selectBranchId(branch.id)}
                style={{ paddingRight: 74 }}
              />
              <Pressable
                className="absolute right-4 top-4 rounded-full bg-light-secondary px-2 py-1 dark:bg-dark-secondary"
                onPress={() => flow.openBranchDetails(branch.id)}>
                <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                  {t('reservationMore')}
                </ThemedText>
              </Pressable>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
