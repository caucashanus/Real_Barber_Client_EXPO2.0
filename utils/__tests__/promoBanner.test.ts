import { describe, expect, it } from 'vitest';

import { parsePromoBannerResponse } from '@/utils/promoBannerParse';

describe('parsePromoBannerResponse', () => {
  it('parses active banner envelope', () => {
    const banner = parsePromoBannerResponse({
      banner: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        imageUrl: 'https://cdn.example.com/promo.webp',
        ctaLabel: 'Akce',
        ctaUrl: 'https://realbarber.cz/akce',
        startsAt: '2026-04-01T00:00:00.000Z',
        endsAt: '2026-04-30T23:59:59.999Z',
        updatedAt: '2026-03-26T10:00:00.000Z',
      },
    });
    expect(banner?.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(banner?.ctaLabel).toBe('Akce');
  });

  it('returns null for empty envelope', () => {
    expect(parsePromoBannerResponse({ banner: null })).toBeNull();
  });

  it('rejects mismatched cta pair', () => {
    expect(
      parsePromoBannerResponse({
        banner: {
          id: 'x',
          imageUrl: 'https://cdn.example.com/p.webp',
          ctaLabel: 'Go',
          ctaUrl: null,
          startsAt: '',
          endsAt: '',
          updatedAt: '',
        },
      })
    ).toBeNull();
  });
});
