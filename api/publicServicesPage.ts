import { fetchCrm } from './http';

export interface PublicServiceCategory {
  id: string;
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
}

export interface PublicServiceMedia {
  id: string;
  url: string;
  type?: string;
  order?: number;
}

export interface PublicServicePricing {
  employeeCount?: number;
  minPrice: number;
  maxPrice?: number;
}

export interface PublicService {
  id: string;
  name: string;
  nameEn?: string | null;
  nameUk?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  webUrl?: string | null;
  webUrlEn?: string | null;
  webUrlUk?: string | null;
  category?: PublicServiceCategory;
  media?: PublicServiceMedia[];
  pricing?: PublicServicePricing;
  badge?: string | null;
  rating?: string | null;
  [key: string]: unknown;
}

export interface PublicServicesPageResponse {
  mainServices: PublicService[];
  barveniServices: PublicService[];
  balickyServices: PublicService[];
  meta?: { generatedAt?: string };
}

/** Stejný payload jako web GET /api/public/pages/services */
export async function fetchPublicServicesPage(): Promise<PublicServicesPageResponse> {
  const data = await fetchCrm<PublicServicesPageResponse>('/api/public/pages/services', {
    checkAuth: false,
  });
  return {
    mainServices: data?.mainServices ?? [],
    barveniServices: data?.barveniServices ?? [],
    balickyServices: data?.balickyServices ?? [],
    meta: data?.meta,
  };
}
