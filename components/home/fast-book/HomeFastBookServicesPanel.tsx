import React from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import SiteLoadingState from '@/components/SiteLoadingState';
import ThemedText from '@/components/ThemedText';
import HomeFastBookRepeatSection from '@/components/home/fast-book/HomeFastBookRepeatSection';
import HomeFastBookRowInset from '@/components/home/fast-book/HomeFastBookRowInset';
import HomeFastBookServiceIcon from '@/components/home/fast-book/HomeFastBookServiceIcon';
import HomeFastBookSlotsPick from '@/components/home/fast-book/HomeFastBookSlotsPick';
import {
  HOME_FAST_BOOK_AFTER_SERVICES_CLASS,
  HOME_FAST_BOOK_SHEET_BODY_CLASS,
  HOME_FAST_BOOK_SHEET_FOOTER,
  homeFastBookListTriggerBorderColor,
} from '@/components/home/fast-book/homeFastBookSheetUi';
import useThemeColors from '@/contexts/ThemeColors';
import type { Booking } from '@/api/bookings';
import { HOME_FAST_BOOK_SERVICE_LABEL_KEYS } from '@/constants/homeFastBookServices';
import type { Locale } from '@/contexts/LanguageContext';
import type { HomeFastBookFlow } from '@/hooks/useHomeFastBookFlow';
import type { TranslationKey } from '@/locales';

function sheetScrollMaxHeight(): number {
  return Dimensions.get('window').height * 0.55;
}

type Props = {
  flow: HomeFastBookFlow;
  locale: Locale;
  bookings: Booking[] | null | undefined;
  bookingsLoading?: boolean;
  t: (key: TranslationKey) => string;
};

export default function HomeFastBookServicesPanel({
  flow,
  locale,
  bookings,
  bookingsLoading,
  t,
}: Props) {
  const colors = useThemeColors();
  const listTriggerBorderColor = homeFastBookListTriggerBorderColor(colors.isDark);
  const timingPillLabel =
    flow.whenChoice === 'later' ? t('fastBookWhenLater') : t('fastBookNearestCta');
  const timingPillIcon = flow.whenChoice === 'later' ? 'Calendar' : 'Clock';
  const collapsedToOne = flow.selectedServiceId != null;
  const showSlotContinue =
    flow.selectedServiceId != null &&
    !flow.slotsLoading &&
    !flow.slotsError &&
    flow.loadedSlots != null &&
    flow.selectedSlotKey != null;

  return (
    <View className="w-full">
      <View className="shrink-0 flex-row items-center gap-2 px-4 pb-2 pt-1">
        <Pressable
          onPress={flow.goBackServices}
          accessibilityRole="button"
          className="-ml-1 flex-row items-center gap-1 py-2 pr-3 active:opacity-70">
          <Icon name="ChevronLeft" size={22} className="text-foreground" />
          <ThemedText className="text-base font-medium">{t('fastBookWhenBack')}</ThemedText>
        </Pressable>
        <ThemedText className="min-w-0 flex-1 text-center text-lg font-bold" numberOfLines={1}>
          {t('fastBookPlaceholder')}
        </ThemedText>
        <View className="w-16" />
      </View>

      <View className="shrink-0 flex-row justify-end px-4 pb-2 pt-2">
        <Button
          title={timingPillLabel}
          variant="outline"
          size="small"
          rounded="full"
          iconStart={timingPillIcon}
          iconEnd="ChevronDown"
          iconSize={12}
          onPress={flow.openWhenFromPill}
          accessibilityState={{ expanded: flow.whenOpen }}
          className="shrink-0 px-2 py-1"
          textClassName="text-xs font-semibold"
          style={{ minHeight: 28, borderColor: listTriggerBorderColor }}
        />
      </View>

      <ScrollView
        className="w-full"
        style={{ maxHeight: sheetScrollMaxHeight() }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className={`w-full ${HOME_FAST_BOOK_SHEET_BODY_CLASS}`}>
          <View className="w-full gap-0.5">
            {flow.listServices.map((service) =>
              collapsedToOne ? (
                <Pressable
                  key={service.id}
                  onPress={() => flow.onServicePress(service)}
                  className="w-full active:opacity-70">
                  <HomeFastBookRowInset>
                    <View className="flex-row items-center gap-2.5 rounded-md py-0">
                      <HomeFastBookServiceIcon service={service} size="md" />
                      <ThemedText className="min-w-0 flex-1 text-base font-semibold" numberOfLines={1}>
                        {t(HOME_FAST_BOOK_SERVICE_LABEL_KEYS[service.id])}
                      </ThemedText>
                    </View>
                  </HomeFastBookRowInset>
                </Pressable>
              ) : (
                <Pressable
                  key={service.id}
                  onPress={() => flow.onServicePress(service)}
                  className="w-full active:opacity-70">
                  <HomeFastBookRowInset>
                    <View className="flex-row items-center gap-3.5 rounded-md py-3">
                      <HomeFastBookServiceIcon service={service} size="lg" />
                      <ThemedText className="min-w-0 flex-1 text-base font-bold" numberOfLines={2}>
                        {t(HOME_FAST_BOOK_SERVICE_LABEL_KEYS[service.id])}
                      </ThemedText>
                    </View>
                  </HomeFastBookRowInset>
                </Pressable>
              )
            )}
          </View>

          {!flow.selectedServiceId ? (
            <HomeFastBookRepeatSection
              bookings={bookings}
              loading={bookingsLoading}
              t={t}
              onCloseSheet={flow.dismissSheetsForHandoff}
            />
          ) : null}

          {flow.selectedServiceId ? (
            flow.slotsLoading ? (
              <HomeFastBookRowInset className={HOME_FAST_BOOK_AFTER_SERVICES_CLASS}>
                <SiteLoadingState layout="inline" />
              </HomeFastBookRowInset>
            ) : flow.slotsError || !flow.loadedSlots ? (
              <HomeFastBookRowInset className={HOME_FAST_BOOK_AFTER_SERVICES_CLASS}>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  {t('fastBookNearestSlotsEmpty')}
                </ThemedText>
              </HomeFastBookRowInset>
            ) : (
              <HomeFastBookSlotsPick
                slots={flow.loadedSlots.slots}
                selectedSlotKey={flow.selectedSlotKey}
                onSelectSlot={flow.setSelectedSlot}
                locale={locale}
                t={t}
              />
            )
          ) : null}
        </View>
      </ScrollView>

      {showSlotContinue ? (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            title={t('bookingContinue')}
            variant="ghost"
            size="medium"
            className="w-full py-4"
            onPress={() => void flow.confirmSelectedSlot()}
            style={{ backgroundColor: colors.text, minHeight: 44 }}
            textClassName={`font-medium ${colors.isDark ? 'text-[#0f0f0f]' : 'text-white'}`}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    ...HOME_FAST_BOOK_SHEET_FOOTER,
  },
});
