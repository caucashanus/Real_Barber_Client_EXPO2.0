import type {
  ClientCatalogProduct,
  ClientCatalogProductReview,
  ClientProductPurchase,
} from '@/api/products';
import type { Locale } from '@/app/contexts/LanguageContext';
import type { TranslationKey } from '@/locales';
import { compareCatalogStockWarehouseRows, warehouseUiName } from '@/utils/catalogWarehouse';

export function formatReviewDate(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(locale === 'cs' ? 'cs-CZ' : 'en-GB', {
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return iso;
  }
}

export function formatPurchaseDate(iso: string, locale: Locale): string {
  try {
    const d = new Date(iso);
    if (locale === 'cs') {
      return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function purchasePaymentMethodLabel(
  method: string | undefined,
  t: (key: TranslationKey) => string
): string {
  if (!method) return '—';
  const normalized = method.trim().toUpperCase().replace(/\s+/g, '_');
  if (normalized === 'CASH') return t('paymentMethodCash');
  if (normalized === 'CARD' || normalized === 'CREDIT_CARD' || normalized === 'DEBIT_CARD')
    return t('paymentMethodCard');
  if (normalized === 'RBC' || normalized === 'RB_COINS' || normalized === 'RBCOINS')
    return t('paymentMethodRbc');
  return method
    .split('_')
    .map((part) =>
      part.toLowerCase() === 'rbc'
        ? 'RBC'
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join(' ');
}

export function purchasePaymentBreakdownRows(purchase: ClientProductPurchase): boolean {
  const n = [purchase.totalCash, purchase.totalCard, purchase.totalCoins].filter(
    (v) => v > 0
  ).length;
  return n > 1;
}

export function purchaseHasCashbackFields(purchase: ClientProductPurchase): boolean {
  return purchase.cashbackAmount != null || purchase.cashbackPaid != null;
}

export function computeReviewStats(reviews: readonly { rating: number }[]) {
  const countByRating: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of reviews) {
    const rating = Math.min(5, Math.max(1, Math.round(r.rating) || 0));
    countByRating[rating] = (countByRating[rating] ?? 0) + 1;
    sum += r.rating;
  }
  const total = reviews.length;
  const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
  return { countByRating, average, total };
}

export function catalogReviewDisplayName(
  review: ClientCatalogProductReview,
  anonymousLabel: string
): string {
  if (review.isAnonymous) return anonymousLabel;
  const a = review.author;
  if (!a) return anonymousLabel;
  const named = a.name?.trim();
  if (named) return named;
  const parts = [a.firstName, a.lastName].filter(Boolean);
  const joined = parts.join(' ').trim();
  return joined || anonymousLabel;
}

export function catalogReviewBody(review: ClientCatalogProductReview): string {
  const d = review.description?.trim();
  if (d) return d;
  const p = review.positiveFeedback?.trim();
  if (p) return p;
  const n = review.negativeFeedback?.trim();
  if (n) return n;
  return '—';
}

const PRODUCT_SHARE_DESC_MAX = 400;

function truncateForShare(text: string, max: number): string {
  const s = text.replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function warehouseShareAddressLines(warehouse: { address?: string; location?: string }): string[] {
  const addr = warehouse.address?.trim();
  const loc = warehouse.location?.trim();
  const out: string[] = [];
  if (addr) out.push(addr);
  if (loc && (!addr || loc !== addr)) out.push(loc);
  return out;
}

function appendPrimaryImageUrlToShare(
  lines: string[],
  primaryImageUrl: string | undefined,
  t: (key: TranslationKey) => string
): void {
  const u = primaryImageUrl?.trim();
  if (!u) return;
  lines.push('', `${t('productSharePrimaryImage')}:`, u);
}

function appendProductShareFooter(lines: string[]): void {
  lines.push('', 'https://realbarber.cz', 'tel:+420608332881');
}

export function buildProductShareMessage(params: {
  t: (key: TranslationKey) => string;
  catalogWarehouseLabel: string;
  catalog: ClientCatalogProduct | null;
  purchase: ClientProductPurchase | null;
  productTitle: string;
  totalPriceLabel: string;
  primaryImageUrl?: string;
}): string {
  const {
    t,
    catalogWarehouseLabel,
    catalog,
    purchase,
    productTitle,
    totalPriceLabel,
    primaryImageUrl,
  } = params;
  const lines: string[] = [];

  if (catalog) {
    lines.push(t('productShareIntroRealBarber'), '', productTitle);
    const desc = catalog.description?.trim();
    if (desc) {
      lines.push('', truncateForShare(desc, PRODUCT_SHARE_DESC_MAX));
    }
    lines.push(
      '',
      `${t('productSharePrice')}: ${totalPriceLabel}`,
      `${t('productStock')}: ${catalog.totalStock}`,
      `${t('productAvailability')}: ${catalog.inStock ? t('productsCatalogInStock') : t('productsCatalogOutOfStock')}`
    );
    if (catalog.stockByWarehouse && catalog.stockByWarehouse.length > 0) {
      lines.push('', t('productStockByWarehouse'));
      for (const row of [...catalog.stockByWarehouse].sort((a, b) =>
        compareCatalogStockWarehouseRows(a, b, catalogWarehouseLabel)
      )) {
        const wh = warehouseUiName(row.warehouse.name, catalogWarehouseLabel);
        const pcs = t('productPiecesAbbr');
        lines.push(`• ${wh}: ${row.quantity} ${pcs}`);
        for (const addrLine of warehouseShareAddressLines(row.warehouse)) {
          lines.push(`  ${addrLine}`);
        }
      }
    }
    appendPrimaryImageUrlToShare(lines, primaryImageUrl, t);
    appendProductShareFooter(lines);
    return lines.join('\n');
  }

  if (purchase) {
    lines.push(t('productShareIntroRealBarber'), '', productTitle);
    const desc = purchase.product.description?.trim();
    if (desc) {
      lines.push('', truncateForShare(desc, PRODUCT_SHARE_DESC_MAX));
    }
    lines.push('', `${t('productSharePrice')}: ${totalPriceLabel}`);
    lines.push(`${t('productSharePurchaseQuantity')}: ${purchase.quantity}`);
    const whName = purchase.warehouse?.name?.trim();
    if (whName) {
      lines.push(`${t('productSharePickupWarehouse')}: ${whName}`);
      for (const addrLine of warehouseShareAddressLines(purchase.warehouse ?? {})) {
        lines.push(`  ${addrLine}`);
      }
    }
    appendPrimaryImageUrlToShare(lines, primaryImageUrl, t);
    appendProductShareFooter(lines);
    return lines.join('\n');
  }

  return [t('productShareIntroRealBarber'), '', productTitle].join('\n');
}
