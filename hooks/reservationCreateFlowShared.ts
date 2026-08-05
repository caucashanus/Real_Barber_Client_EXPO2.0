import type { Dispatch, SetStateAction } from 'react';

import type { ReservationFlowData } from '@/utils/reservationCreateHelpers';

export interface ReservationFlowDataState {
  data: ReservationFlowData;
  setData: Dispatch<SetStateAction<ReservationFlowData>>;
}

export interface ReservationMonthState {
  monthOffset: number;
  setMonthOffset: Dispatch<SetStateAction<number>>;
  lastSelectedDateByMonth: Record<string, string>;
  setLastSelectedDateByMonth: Dispatch<SetStateAction<Record<string, string>>>;
}
