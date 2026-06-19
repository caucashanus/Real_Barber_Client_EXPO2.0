import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import type { ReservationCreateStepProps } from './types';

import { CardScroller } from '@/components/CardScroller';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';

export default function ReservationServiceStep({ flow }: ReservationCreateStepProps) {
  const { t } = flow;

  return (
    <ScrollView className="px-6 pb-4 pt-2">
      <View className="mb-3 items-center">
        <Image
          source={require('@/assets/img/reservation-service.png')}
          className="h-16 w-16"
          style={{ width: 64, height: 64 }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
      <View className="mb-5">
        <ThemedText variant="h2">
          {t('reservationStepServiceTitle')}
        </ThemedText>
        <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
          {t('reservationStepServiceSubtitle')}
        </ThemedText>
      </View>
      {(flow.loadingBranchServicesFetch ||
        (flow.loadingAggregatedBranchServices && flow.branchStepServiceOptions.length === 0)) &&
      flow.branchStepServiceOptions.length === 0 ? (
        <View className="items-center py-10">
          <ActivityIndicator size="small" />
          <ThemedText className="mt-3 text-sm text-light-subtext dark:text-dark-subtext">
            {t('commonLoading')}
          </ThemedText>
        </View>
      ) : null}
      {!flow.loadingBranchServicesFetch && flow.branchStepServiceCategories.length > 0
        ? flow.branchStepServiceCategories.map((category, categoryIndex) => (
            <Section
              key={`res-svc-cat-${category.key}-${categoryIndex}`}
              title={category.name}
              titleSize="lg"
              className="mb-4">
              <CardScroller className="mt-1.5 pb-1" space={12}>
                {category.services.map((service, serviceIndex) => {
                  const isSelected = flow.data.itemId === service.id;
                  return (
                    <Pressable
                      key={`res-svc-${category.key}-${service.id}-${serviceIndex}`}
                      onPress={() => flow.selectServiceOption(service)}
                      className="w-[160px] active:opacity-80">
                      <View
                        className="relative overflow-hidden rounded-2xl"
                        style={
                          isSelected
                            ? { borderColor: flow.colors.highlight, borderWidth: 2 }
                            : undefined
                        }>
                        <Image
                          source={
                            service.imageUrl
                              ? { uri: service.imageUrl }
                              : require('@/assets/img/barbers.png')
                          }
                          className="h-[140px] w-[160px]"
                          contentFit="cover"
                        />
                        <View className="absolute right-2 top-2 z-10 rounded-full bg-light-secondary px-2 py-1 dark:bg-dark-secondary">
                          <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                            {t('reservationPriceFromPrefix')} {service.price}{' '}
                            {t('reservationCurrencySuffix')}
                          </ThemedText>
                        </View>
                      </View>
                      <View className="w-full py-2">
                        <ThemedText variant="bodySm" className="min-w-0" numberOfLines={2}>
                          {service.name}
                        </ThemedText>
                      </View>
                    </Pressable>
                  );
                })}
              </CardScroller>
            </Section>
          ))
        : null}
      {!flow.loadingBranchServicesFetch &&
      !flow.loadingAggregatedBranchServices &&
      flow.branchStepServiceOptions.length === 0 ? (
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          {t('reservationNoServices')}
        </ThemedText>
      ) : null}
    </ScrollView>
  );
}
