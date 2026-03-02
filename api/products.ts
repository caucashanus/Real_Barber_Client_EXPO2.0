const CRM_BASE = 'https://crm.xrb.cz';

export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  order: number;
}

export interface ProductInfo {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  currentPrice: number;
  isActive: boolean;
  images: ProductImage[];
  primaryImage: ProductImage | null;
}

export interface PurchaseSeller {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface PurchaseWarehouse {
  id: string;
  name: string;
  location?: string;
}

export interface ClientProductPurchase {
  purchaseId: string;
  purchaseDate: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod: string;
  totalCash: number;
  totalCard: number;
  totalCoins: number;
  notes: string | null;
  product: ProductInfo;
  seller: PurchaseSeller;
  warehouse: PurchaseWarehouse;
}

export interface ClientProductsResponse {
  products: ClientProductPurchase[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  sorting?: {
    sortBy: string;
    sortOrder: string;
  };
}

/** GET /api/client/products – purchased products for the authenticated client. */
export async function getClientProducts(apiToken: string): Promise<ClientProductsResponse> {
  const url = `${CRM_BASE}/api/client/products`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<ClientProductsResponse>;
}
