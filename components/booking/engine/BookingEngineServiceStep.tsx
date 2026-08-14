import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { ActionSheetRef } from 'react-native-actions-sheet';

import ActionSheetThemed from '@/components/ActionSheetThemed';
import { Button } from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import BookingPanelPickerRow from '@/components/booking/engine/BookingPanelPickerRow';
import BookingServiceCategoryAccordion from '@/components/booking/engine/BookingServiceCategoryAccordion';
import type { BookingService } from '@/lib/booking/constants';
import {
  groupServicesByCategory,
  isBookingServiceAccordionCategory,
} from '@/lib/booking/groupServicesByCategory';
import { SERVICES_CATEGORY_ID } from '@/lib/booking/categoryIds';
import { formatBookingServicePriceLabel } from '@/lib/booking/designShared';

interface BookingEngineServiceStepProps {
  services: BookingService[];
  loading?: boolean;
  showServiceInfo?: boolean;
  selectedServiceId?: string;
  selectLabel: string;
  fromPriceLabel: string;
  currencySuffix: string;
  onSelect: (service: BookingService) => void;
  closeLabel: string;
}

function serviceImageUrl(service: BookingService): string | null {
  const url = service.imageUrl ?? service.avatarUrl;
  return typeof url === 'string' && url.trim() ? url.trim() : null;
}

export default function BookingEngineServiceStep({
  services,
  loading = false,
  showServiceInfo = false,
  selectedServiceId,
  selectLabel,
  fromPriceLabel,
  currencySuffix,
  onSelect,
  closeLabel,
}: BookingEngineServiceStepProps) {
  const detailSheetRef = useRef<ActionSheetRef>(null);
  const [detailService, setDetailService] = useState<BookingService | null>(null);

  const servicesByCategory = useMemo(() => groupServicesByCategory(services), [services]);

  const mainServices = servicesByCategory.find((cat) => cat.categoryId === SERVICES_CATEGORY_ID);
  const accordionCategories = servicesByCategory.filter((cat) =>
    isBookingServiceAccordionCategory(cat.categoryId)
  );

  const openServiceDetail = (service: BookingService) => {
    setDetailService(service);
    detailSheetRef.current?.show();
  };

  const renderServices = (list: BookingService[]) =>
    list.map((service) => (
      <BookingPanelPickerRow
        key={service.id}
        imageUrl={serviceImageUrl(service)}
        avatarSize="xl"
        fallbackName={service.name ?? service.id}
        title={service.name ?? service.id}
        description={formatBookingServicePriceLabel(service, fromPriceLabel, currencySuffix)}
        selectLabel={selectLabel}
        showInfo={showServiceInfo}
        selected={selectedServiceId === service.id}
        onSelect={() => onSelect(service)}
        onInfo={() => openServiceDetail(service)}
      />
    ));

  if (loading) {
    return (
      <View className="items-center py-10">
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (services.length === 0) {
    return null;
  }

  return (
    <>
      <View>
        {mainServices ? <View>{renderServices(mainServices.services)}</View> : null}
        {accordionCategories.length > 0 ? (
          <BookingServiceCategoryAccordion
            categories={accordionCategories}
            renderServices={renderServices}
          />
        ) : null}
        {!mainServices && accordionCategories.length === 0 ? (
          <View>{renderServices(services)}</View>
        ) : null}
      </View>

      <ActionSheetThemed ref={detailSheetRef} gestureEnabled>
        <View className="px-4 pb-6 pt-2">
          <ThemedText className="text-lg font-bold">
            {detailService?.name ?? '—'}
          </ThemedText>
          {detailService ? (
            <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
              {formatBookingServicePriceLabel(detailService, fromPriceLabel, currencySuffix) ?? '—'}
            </ThemedText>
          ) : null}
          <View className="mt-5 flex-row gap-3">
            <Button
              title={selectLabel}
              variant="outline"
              className="flex-1"
              onPress={() => {
                if (detailService) onSelect(detailService);
                detailSheetRef.current?.hide();
              }}
            />
            <Button
              title={closeLabel}
              variant="ghost"
              className="flex-1"
              onPress={() => detailSheetRef.current?.hide()}
            />
          </View>
        </View>
      </ActionSheetThemed>
    </>
  );
}
