import type { ClientCatalogWarehouse } from '@/api/products';

/** Název skladu z API, který v UI zobrazujeme jako centrální sklad a řadíme na konec seznamu. */
const MAIN_CENTRAL_WAREHOUSE_NAME = 'Hl. Sklad';

export function isMainCentralWarehouse(name: string | undefined): boolean {
  return (name?.trim().toLowerCase() ?? '') === MAIN_CENTRAL_WAREHOUSE_NAME.toLowerCase();
}

export function warehouseUiName(name: string | undefined, centralDisplayLabel: string): string {
  if (!name) return '';
  if (isMainCentralWarehouse(name)) return centralDisplayLabel;
  return name;
}

export function compareCatalogStockWarehouseRows<T extends { warehouse: { name: string } }>(
  a: T,
  b: T,
  centralDisplayLabel: string
): number {
  const aCentral = isMainCentralWarehouse(a.warehouse.name);
  const bCentral = isMainCentralWarehouse(b.warehouse.name);
  if (aCentral !== bCentral) return aCentral ? 1 : -1;
  const an = warehouseUiName(a.warehouse.name, centralDisplayLabel);
  const bn = warehouseUiName(b.warehouse.name, centralDisplayLabel);
  return an.localeCompare(bn, undefined, { sensitivity: 'base' });
}

/** Řetězec pro geokódování (adresa → mapa). */
export function warehouseGeocodeQuery(
  warehouse: ClientCatalogWarehouse,
  displayName: string
): string {
  const parts = [warehouse.address, warehouse.location, displayName].filter(
    (p) => p && String(p).trim()
  );
  return parts.join(', ');
}
