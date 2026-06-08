import { describe, expect, it } from 'vitest';

import { buildProductShareMessage, computeReviewStats } from '@/utils/productDetailHelpers';

describe('productDetailHelpers', () => {
  it('computes average rating', () => {
    const stats = computeReviewStats([{ rating: 4 }, { rating: 5 }]);
    expect(stats.average).toBe(4.5);
    expect(stats.total).toBe(2);
  });

  it('builds share message for catalog product', () => {
    const message = buildProductShareMessage({
      t: (k) => k,
      catalogWarehouseLabel: 'Central',
      catalog: {
        id: 'p1',
        name: 'Pomade',
        description: 'Strong hold',
        price: 299,
        totalStock: 5,
        inStock: true,
        stockByWarehouse: [],
        flags: [],
        reviews: [],
        images: [],
        primaryImage: null,
        sku: null,
        webUrl: null,
        isActive: true,
        createdAt: '2026-01-01',
      } as import('@/api/products').ClientCatalogProduct,
      purchase: null,
      productTitle: 'Pomade',
      totalPriceLabel: '299 Kč',
      primaryImageUrl: undefined,
    });

    expect(message).toContain('Pomade');
    expect(message).toContain('productSharePrice');
  });
});
