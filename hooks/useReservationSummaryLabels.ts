import { useCallback, useMemo } from 'react';

import type { Branch } from '@/api/branches';
import {
  getBranchCardImageSource,
  type ReservationFlowData,
  type ServiceOption,
} from '@/utils/reservationCreateHelpers';

interface SelectedEmployeeSummary {
  name?: string;
}

interface UseReservationSummaryLabelsParams {
  data: ReservationFlowData;
  dateLocaleTag: string;
  selectedEmployee: SelectedEmployeeSummary | null;
  selectedService: ServiceOption | null;
  presetItemName: string | undefined;
  presetItemId: string | undefined;
  branchForServiceStep: Branch | null;
}

export function useReservationSummaryLabels({
  data,
  dateLocaleTag,
  selectedEmployee,
  selectedService,
  presetItemName,
  presetItemId,
  branchForServiceStep,
}: UseReservationSummaryLabelsParams) {
  const formatReservationPrice = useCallback(
    (value: number) =>
      value.toLocaleString(dateLocaleTag, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [dateLocaleTag]
  );

  const selectedEmployeeName = selectedEmployee?.name ?? '—';
  const selectedServiceName =
    selectedService?.name ??
    (presetItemName && data.itemId === presetItemId ? presetItemName : null) ??
    '—';
  const selectedDateLabel = data.date
    ? new Date(data.date).toLocaleDateString(dateLocaleTag, {
        weekday: 'short',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      })
    : '—';
  const summaryBranchCardImage = useMemo(
    () => getBranchCardImageSource(branchForServiceStep),
    [branchForServiceStep]
  );

  return {
    formatReservationPrice,
    selectedEmployeeName,
    selectedServiceName,
    selectedDateLabel,
    summaryBranchCardImage,
  };
}
