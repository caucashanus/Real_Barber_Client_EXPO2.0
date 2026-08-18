import React from 'react';
import { View } from 'react-native';

import type { BookingEngineFlow } from '@/hooks/useBookingEngineFlow';
import AppButton from '@/components/AppButton';
import BookingPanelPickerRow from '@/components/booking/engine/BookingPanelPickerRow';
import { branchImageUrl } from '@/lib/booking/designShared';
import SiteLoadingSpinner from '@/components/SiteLoadingSpinner';

interface Props {
  flow: BookingEngineFlow;
}

export default function BookingEngineBranchStep({ flow }: Props) {
  const { t } = flow;

  return (
    <View>
      <AppButton
        title={t('reservationShowMap')}
        variant="outline"
        size="sm"
        rounded="full"
        className="self-start px-2.5 py-1"
        iconStart="Map"
        iconSize={13}
        textClassName="text-xs font-semibold leading-tight"
        href="/screens/map"
      />

      {flow.loading ? (
        <View className="items-center py-10">
          <SiteLoadingSpinner size="compact" />
        </View>
      ) : (
        flow.branches.map((branch) => (
          <BookingPanelPickerRow
            key={branch.id}
            imageUrl={branchImageUrl(branch)}
            imageFit="contain"
            fallbackName={branch.name ?? branch.id}
            title={branch.name ?? branch.id}
            description={branch.address ?? ''}
            selected={flow.selectedBranch?.id === branch.id}
            onPress={() => flow.selectBranch(branch)}
          />
        ))
      )}
    </View>
  );
}
