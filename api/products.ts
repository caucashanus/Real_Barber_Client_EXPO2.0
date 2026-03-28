const CRM_BASE = 'https://crm.xrb.cz';

/** Flag „Prodejní“ – katalog produktů v aplikaci (GET …/by-flag). */
export const CLIENT_PRODUCTS_CATALOG_FLAG_ID = 'fde9d7f6-b299-4824-80f8-2f6f4a3df2c7';

/** Flag „Dárky“ – sekce dárků na obrazovce Produktů. */
export const CLIENT_PRODUCTS_GIFTS_FLAG_ID = 'b971ec56-060e-434a-b49e-6e70bcfbb6bd';

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
  /** Vyplacený / připisovaný cashback z nákupu (pokud API vrací). */
  cashbackAmount?: number | null;
  cashbackPaid?: boolean | null;
  cashbackUnit?: string | null;
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

/** Warehouse snapshot on catalog product (stockByWarehouse). */
export interface ClientCatalogWarehouse {
  id: string;
  name: string;
  location?: string;
  address?: string;
}

export interface ClientCatalogStockByWarehouse {
  quantity: number;
  warehouse: ClientCatalogWarehouse;
}

export interface ClientCatalogReviewAuthor {
  name?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
}

/** Štítek / flag produktu (např. Prodejní, Na vlasy). */
export interface ClientCatalogProductFlag {
  id: string;
  name: string;
  color: string;
  description: string;
}

/** Recenze produktu v odpovědi GET /api/client/products/by-flag. */
export interface ClientCatalogProductReview {
  id: string;
  rating: number;
  positiveFeedback?: string;
  negativeFeedback?: string;
  description?: string;
  images?: unknown[];
  isAnonymous?: boolean;
  createdAt: string;
  author?: ClientCatalogReviewAuthor | null;
}

/** Product row from GET /api/client/products/by-flag (catalog, not necessarily purchased). */
export interface ClientCatalogProduct {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  webUrl: string | null;
  isActive: boolean;
  createdAt: string;
  images: ProductImage[];
  primaryImage: ProductImage | null;
  totalStock: number;
  inStock: boolean;
  /** Volitelné – rozpad skladu po pobočkách / skladech. */
  stockByWarehouse?: ClientCatalogStockByWarehouse[];
  /** Recenze k produktu (stejný zdroj jako katalog). */
  reviews?: ClientCatalogProductReview[];
  /** Všechny flagy produktu (ne jen filtr dotazu). */
  flags?: ClientCatalogProductFlag[];
}

export interface ClientProductsByFlagResponse {
  products: ClientCatalogProduct[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  flag: {
    id: string;
    name: string;
    color: string;
    description: string;
  };
}

export interface GetClientProductsByFlagOptions {
  flagId?: string;
  limit?: number;
  offset?: number;
}

/** GET /api/client/products/by-flag – catalog products tagged with the given flag. */
export async function getClientProductsByFlag(
  apiToken: string,
  options: GetClientProductsByFlagOptions = {}
): Promise<ClientProductsByFlagResponse> {
  const flagId = options.flagId ?? CLIENT_PRODUCTS_CATALOG_FLAG_ID;
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;
  const qs = new URLSearchParams({
    flagId,
    limit: String(limit),
    offset: String(offset),
  });
  const url = `${CRM_BASE}/api/client/products/by-flag?${qs.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<ClientProductsByFlagResponse>;
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
