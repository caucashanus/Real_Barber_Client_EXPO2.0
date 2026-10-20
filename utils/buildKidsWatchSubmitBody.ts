import type { Booking } from '@/api/bookings';
import type { KidsWatchSubmitBody } from '@/api/kids-watch';
import type { KidsWatchAvoidId } from '@/constants/kidsWatchAvoidOptions';
import type { KidsWatchFormState } from '@/utils/kidsWatchHelpers';

function allowFlags(avoidIds: readonly string[]) {
  const avoid = new Set(avoidIds);
  return {
    allowSweetDrink: !avoid.has('sweetDrink'),
    allowCandy: !avoid.has('candy'),
    allowNuts: !avoid.has('nuts'),
    allowDairy: !avoid.has('dairy'),
    allowStylingProducts: !avoid.has('stylingProducts'),
    allowShampooConditioner: !avoid.has('shampooConditioner'),
  } satisfies Pick<
    KidsWatchSubmitBody,
    | 'allowSweetDrink'
    | 'allowCandy'
    | 'allowNuts'
    | 'allowDairy'
    | 'allowStylingProducts'
    | 'allowShampooConditioner'
  >;
}

export function buildKidsWatchSubmitBody(input: {
  booking: Booking;
  form: KidsWatchFormState;
  note: string;
  clientName?: string | null;
  clientEmail?: string | null;
  haircutPhotoUrls: string[];
}): KidsWatchSubmitBody {
  const { booking, form, note, clientName, clientEmail, haircutPhotoUrls } = input;
  const resolvedEmail =
    form.contactEmail.trim() || clientEmail?.trim() || undefined;

  return {
    bookingId: booking.id,
    date: booking.date,
    slot: booking.slotStart,
    branchName: booking.branch?.name?.trim() || undefined,
    employeeName: booking.employee?.name?.trim() || undefined,
    serviceName: booking.item?.name?.trim() || undefined,
    usePickupPin: form.usePin,
    pickupPin: form.usePin ? form.pin : null,
    notifyStart: form.notifyArrival,
    notifyEnd: form.notifyDeparture,
    ...allowFlags(form.avoidIds as KidsWatchAvoidId[]),
    haircutPhotoUrls,
    contactPhone: form.phone.trim(),
    preferredContact: form.preferredContact,
    clientEmail: resolvedEmail,
    clientName: clientName?.trim() || undefined,
    note: note.trim() || null,
    isLoggedIn: true,
    contactUseProfileDefaults: form.contactUseProfileDefaults,
  };
}
