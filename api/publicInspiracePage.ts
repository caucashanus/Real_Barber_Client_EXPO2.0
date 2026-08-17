import { fetchCrm } from './http';

export interface PublicInspiracePageItem {
  id: string;
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
  webUrl?: string | null;
  webUrlEn?: string | null;
  webUrlUk?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  imageAltEn?: string | null;
  imageAltUk?: string | null;
  tag?: string | null;
  tagEn?: string | null;
  tagUk?: string | null;
  popularity?: number | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionUk?: string | null;
  isNew?: boolean;
}

export interface PublicInspiracePageResponse {
  items: PublicInspiracePageItem[];
  meta?: {
    generatedAt?: string;
    count?: number;
  };
}

/** Stejný payload jako web GET /api/public/pages/inspirace */
export async function fetchPublicInspiracePage(): Promise<PublicInspiracePageResponse> {
  const data = await fetchCrm<PublicInspiracePageResponse>('/api/public/pages/inspirace', {
    checkAuth: false,
  });

  return {
    items: data?.items ?? [],
    meta: data?.meta,
  };
}
