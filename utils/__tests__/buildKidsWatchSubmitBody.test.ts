import { buildKidsWatchSubmitBody } from '@/utils/buildKidsWatchSubmitBody';
import type { KidsWatchFormState } from '@/utils/kidsWatchHelpers';

describe('buildKidsWatchSubmitBody', () => {
  it('maps avoid selections to allow* false', () => {
    const form: KidsWatchFormState = {
      pin: '1234',
      usePin: true,
      notifyArrival: true,
      notifyDeparture: true,
      avoidIds: ['candy', 'nuts'],
      photoUris: [],
      phone: '+420777123456',
      preferredContact: 'phone',
      contactEmail: '',
      contactUseProfileDefaults: false,
      note: '',
    };

    const body = buildKidsWatchSubmitBody({
      booking: {
        id: 'b1',
        date: '2026-05-01',
        slotStart: '10:00',
        branch: { name: 'Praha' },
        employee: { name: 'Jan' },
        item: { name: 'Děti' },
      } as never,
      form,
      note: 'hello',
      haircutPhotoUrls: [],
    });

    expect(body.allowCandy).toBe(false);
    expect(body.allowNuts).toBe(false);
    expect(body.allowDairy).toBe(true);
    expect(body.usePickupPin).toBe(true);
    expect(body.notifyStart).toBe(true);
    expect(body.bookingId).toBe('b1');
  });
});
