import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface BranchFilterState {
  minSizeM2: number;
  minChairs: number | undefined;
  minWashBasins: number | undefined;
  amenities: {
    cardPayment: boolean;
    coffeeMachine: boolean;
    selfServiceCheckout: boolean;
    within100mMetro: boolean;
    within100mTram: boolean;
    within100mBus: boolean;
    airConditioning: boolean;
    wifi: boolean;
    parking: boolean;
  };
  options: {
    wheelchairAccessible: boolean;
    airCompressors: boolean;
    electricallyAdjustableChairs: boolean;
  };
}

const defaultFilter: BranchFilterState = {
  minSizeM2: 20,
  minChairs: undefined,
  minWashBasins: undefined,
  amenities: {
    cardPayment: false,
    coffeeMachine: false,
    selfServiceCheckout: false,
    within100mMetro: false,
    within100mTram: false,
    within100mBus: false,
    airConditioning: false,
    wifi: false,
    parking: false,
  },
  options: {
    wheelchairAccessible: false,
    airCompressors: false,
    electricallyAdjustableChairs: false,
  },
};

type BranchFilterContextValue = {
  filter: BranchFilterState;
  setFilter: (f: BranchFilterState) => void;
  resetFilter: () => void;
  hasActiveFilter: boolean;
};

const BranchFilterContext = createContext<BranchFilterContextValue | null>(null);

export function BranchFilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilterState] = useState<BranchFilterState>(defaultFilter);

  const setFilter = useCallback((f: BranchFilterState) => {
    setFilterState(f);
  }, []);

  const resetFilter = useCallback(() => {
    setFilterState(defaultFilter);
  }, []);

  const hasActiveFilter =
    filter.minSizeM2 > defaultFilter.minSizeM2 ||
    filter.minChairs != null ||
    filter.minWashBasins != null ||
    Object.values(filter.amenities).some(Boolean) ||
    Object.values(filter.options).some(Boolean);

  const value: BranchFilterContextValue = {
    filter,
    setFilter,
    resetFilter,
    hasActiveFilter,
  };

  return <BranchFilterContext.Provider value={value}>{children}</BranchFilterContext.Provider>;
}

export function useBranchFilter() {
  const ctx = useContext(BranchFilterContext);
  if (!ctx) throw new Error('useBranchFilter must be used within BranchFilterProvider');
  return ctx;
}
