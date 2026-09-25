export type PromoBanner = {
  id: string;
  imageUrl: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  startsAt: string;
  endsAt: string;
  updatedAt: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseNullableString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parsePromoBannerRecord(raw: unknown): PromoBanner | null {
  if (raw == null || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const id = isNonEmptyString(record.id) ? record.id.trim() : '';
  const imageUrl = isNonEmptyString(record.imageUrl) ? record.imageUrl.trim() : '';
  if (!id || !imageUrl) return null;

  const ctaLabel = parseNullableString(record.ctaLabel);
  const ctaUrl = parseNullableString(record.ctaUrl);
  if ((ctaLabel && !ctaUrl) || (!ctaLabel && ctaUrl)) return null;

  return {
    id,
    imageUrl,
    ctaLabel,
    ctaUrl,
    startsAt: typeof record.startsAt === 'string' ? record.startsAt : '',
    endsAt: typeof record.endsAt === 'string' ? record.endsAt : '',
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : '',
  };
}

export function parsePromoBannerResponse(raw: unknown): PromoBanner | null {
  if (raw == null || typeof raw !== 'object') return null;
  const banner = (raw as Record<string, unknown>).banner;
  if (banner == null) return null;
  return parsePromoBannerRecord(banner);
}
