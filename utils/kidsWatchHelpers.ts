export { isKidsHaircutBooking } from '@/utils/isKidsHaircutBooking';

export function generateKidsWatchPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** Alias web `generateKidsWatchPickupPin()`. */
export const generateKidsWatchPickupPin = generateKidsWatchPin;

export type KidsWatchFlowStep =
  | 'promo'
  | 'pick'
  | 'pin'
  | 'notify'
  | 'treats'
  | 'photo'
  | 'phone'
  | 'note'
  | 'success';

export const KIDS_WATCH_WIZARD_STEPS: readonly KidsWatchFlowStep[] = [
  'pin',
  'notify',
  'treats',
  'photo',
  'phone',
  'note',
] as const;

export type KidsWatchFormState = {
  pin: string;
  usePin: boolean;
  notifyArrival: boolean;
  notifyDeparture: boolean;
  avoidIds: string[];
  photoUris: string[];
  phone: string;
  preferredContact: import('@/lib/waitlist/preferredContact').WaitlistPreferredContact;
  /** Doplňkový e-mail, když kanál = e-mail a v profilu chybí. */
  contactEmail: string;
  contactUseProfileDefaults: boolean;
  note: string;
};

export function createInitialKidsWatchForm(profilePhone: string): KidsWatchFormState {
  return {
    pin: generateKidsWatchPin(),
    usePin: true,
    notifyArrival: true,
    notifyDeparture: true,
    avoidIds: [],
    photoUris: [],
    phone: profilePhone,
    preferredContact: 'phone',
    contactEmail: '',
    contactUseProfileDefaults: false,
    note: '',
  };
}

export function isKidsWatchPhoneValid(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 9;
}
