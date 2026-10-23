import { describe, expect, it } from 'vitest';

import { resolveBookingMonitorEntry } from '@/lib/booking/monitor/resolveEntry';

describe('resolveBookingMonitorEntry', () => {
  it('returns home-fast-book from query param', () => {
    expect(
      resolveBookingMonitorEntry({
        recipeId: 'branch-first',
        from: 'home-fast-book',
      })
    ).toBe('home-fast-book');
  });

  it('nearest slot handoff wins over from when not yet stored', () => {
    expect(
      resolveBookingMonitorEntry({
        recipeId: 'service-detail',
        nearestSlotHandoff: true,
        from: 'home-fast-book',
      })
    ).toBe('nearest-slot');
  });
});
