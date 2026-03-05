/**
 * Local branch filter attributes (not from API).
 * Keyed by branch name as returned from API (e.g. "Modřany", "Kačerov", "Hagibor", "Barrandov").
 */
export interface BranchFilterAttributes {
  sizeM2: number;
  chairs: number;
  washBasins: number;
  /** Parking, Wifi, Air conditioning, Card payment, Coffee machine */
  amenities: {
    parking: boolean;
    wifi: boolean;
    airConditioning: boolean;
    cardPayment: boolean;
    coffeeMachine: boolean;
    within100mMetro: boolean;
    within100mTram: boolean;
    within100mBus: boolean;
    selfServiceCheckout: boolean;
  };
  /** Additional options */
  options: {
    wheelchairAccessible: boolean;
    airCompressors: boolean;
    electricallyAdjustableChairs: boolean;
  };
}

export const BRANCH_FILTER_DATA: Record<string, BranchFilterAttributes> = {
  Modřany: {
    sizeM2: 76,
    chairs: 7,
    washBasins: 2,
    amenities: {
      parking: true,
      wifi: true,
      airConditioning: true,
      cardPayment: true,
      coffeeMachine: true,
      within100mMetro: false,
      within100mTram: true,
      within100mBus: true,
      selfServiceCheckout: true,
    },
    options: {
      wheelchairAccessible: true,
      airCompressors: true,
      electricallyAdjustableChairs: false,
    },
  },
  Kačerov: {
    sizeM2: 84,
    chairs: 5,
    washBasins: 1,
    amenities: {
      parking: true,
      wifi: true,
      airConditioning: true,
      cardPayment: true,
      coffeeMachine: true,
      within100mMetro: true,
      within100mTram: false,
      within100mBus: true,
      selfServiceCheckout: false,
    },
    options: {
      wheelchairAccessible: true,
      airCompressors: true,
      electricallyAdjustableChairs: false,
    },
  },
  Hagibor: {
    sizeM2: 45,
    chairs: 4,
    washBasins: 1,
    amenities: {
      parking: true,
      wifi: true,
      airConditioning: true,
      cardPayment: true,
      coffeeMachine: true,
      within100mMetro: false,
      within100mTram: true,
      within100mBus: false,
      selfServiceCheckout: false,
    },
    options: {
      wheelchairAccessible: true,
      airCompressors: true,
      electricallyAdjustableChairs: true,
    },
  },
  Barrandov: {
    sizeM2: 45,
    chairs: 4,
    washBasins: 1,
    amenities: {
      parking: true,
      wifi: true,
      airConditioning: true,
      cardPayment: true,
      coffeeMachine: true,
      within100mMetro: false,
      within100mTram: true,
      within100mBus: false,
      selfServiceCheckout: false,
    },
    options: {
      wheelchairAccessible: true,
      airCompressors: true,
      electricallyAdjustableChairs: false,
    },
  },
};
