import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import type { BookingEngineFlow } from '@/app/hooks/useBookingEngineFlow';
import { Button } from '@/components/Button';
import BookingPanelPickerRow from '@/components/booking/engine/BookingPanelPickerRow';
import { getBranchThemeColorCss, branchImageUrl } from '@/lib/booking/designShared';

interface Props {
  flow: BookingEngineFlow;
}

export default function BookingEngineBranchStep({ flow }: Props) {
  const { t } = flow;

  return (
    <View>
      <Button
        title={t('reservationShowMap')}
        variant="outline"
        size="small"
        rounded="full"
        className="self-start px-4"
        href="/screens/map"
      />

      {flow.loading ? (
        <View className="items-center py-10">
          <ActivityIndicator size="small" />
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
            selectLabel={t('bookingBranchSelect')}
            onSelect={() => flow.selectBranch(branch)}
            selectedRingColor={getBranchThemeColorCss(branch)}
          />
        ))
      )}
    </View>
  );
}
