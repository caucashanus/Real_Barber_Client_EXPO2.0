import { describe, expect, it } from 'vitest';

import { isNotificationRead, startOfLocalDayMs } from '@/utils/notificationReadState';

describe('notificationReadState', () => {
  it('treats notifications before baseline as read even when not in read set', () => {
    const baseline = startOfLocalDayMs(new Date('2026-06-16T12:00:00'));
    const readIds = new Set<string>();

    expect(isNotificationRead(readIds, 'old-1', '2026-06-15T18:00:00', baseline)).toBe(true);
    expect(isNotificationRead(readIds, 'new-1', '2026-06-16T08:00:00', baseline)).toBe(false);
  });

  it('prefers explicit read ids over baseline', () => {
    const baseline = startOfLocalDayMs(new Date('2026-06-16T12:00:00'));
    const readIds = new Set(['today-1']);

    expect(isNotificationRead(readIds, 'today-1', '2026-06-16T18:00:00', baseline)).toBe(true);
  });

  it('marks unread when createdAt is missing and id is not in read set', () => {
    const baseline = startOfLocalDayMs(new Date('2026-06-16T12:00:00'));
    expect(isNotificationRead(new Set(), 'unknown-1', undefined, baseline)).toBe(false);
  });
});
