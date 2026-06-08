import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import type { ClientCatalogProduct } from '@/api/products';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { ProductFeatureItem } from '@/components/product/ProductFeatureItem';
import type { TranslationKey } from '@/locales';
import {
  compareCatalogStockWarehouseRows,
  isMainCentralWarehouse,
  warehouseGeocodeQuery,
  warehouseUiName,
} from '@/utils/catalogWarehouse';

interface ProductCatalogDetailsSectionProps {
  catalog: ClientCatalogProduct;
  catalogWarehouseLabel: string;
  t: (key: TranslationKey) => string;
}

export default function ProductCatalogDetailsSection({
  catalog,
  catalogWarehouseLabel,
  t,
}: ProductCatalogDetailsSectionProps) {
  return (
    <>
      {catalog.flags && catalog.flags.length > 0 ? (
        <View className="py-4">
          <View className="flex-row items-start">
            <Icon
              name="Tag"
              size={24}
              strokeWidth={1.5}
              className="mr-3 mt-0.5 text-light-text dark:text-dark-text"
            />
            <View className="min-w-0 flex-1">
              <ThemedText className="mb-2 text-light-text dark:text-dark-text">
                {t('productCatalogFlags')}
              </ThemedText>
              <View className="flex-row flex-wrap gap-2">
                {[...catalog.flags]
                  .sort((a, b) =>
                    a.name.localeCompare(b.name, undefined, {
                      sensitivity: 'base',
                    })
                  )
                  .map((f) => (
                    <View
                      key={f.id}
                      style={{
                        backgroundColor: f.color?.trim() || '#737373',
                      }}
                      className="rounded-full px-3 py-1.5">
                      <Text
                        style={{
                          color: '#ffffff',
                          fontSize: 13,
                          fontWeight: '600',
                        }}
                        numberOfLines={1}>
                        {f.name}
                      </Text>
                    </View>
                  ))}
              </View>
            </View>
          </View>
        </View>
      ) : null}
      <ProductFeatureItem
        icon="Package"
        label={t('productStock')}
        value={String(catalog.totalStock)}
      />
      <ProductFeatureItem
        icon="CircleCheck"
        label={t('productAvailability')}
        value={catalog.inStock ? t('productsCatalogInStock') : t('productsCatalogOutOfStock')}
      />
      {catalog.stockByWarehouse && catalog.stockByWarehouse.length > 0 ? (
        <View className="mt-2 border-t border-neutral-200 pt-4 dark:border-dark-secondary">
          <ThemedText className="mb-2 text-sm font-semibold text-light-text dark:text-dark-text">
            {t('productStockByWarehouse')}
          </ThemedText>
          {[...catalog.stockByWarehouse]
            .sort((a, b) => compareCatalogStockWarehouseRows(a, b, catalogWarehouseLabel))
            .map((row) => {
              const whDisplayName = warehouseUiName(row.warehouse.name, catalogWarehouseLabel);
              const mapQuery = warehouseGeocodeQuery(row.warehouse, whDisplayName);
              const canOpenMap = mapQuery.trim().length > 0;
              const loc = row.warehouse.location?.trim();
              const addr = row.warehouse.address?.trim();
              const separateAddress = Boolean(addr && loc && addr !== loc);
              const addressLineOnly = Boolean(addr && !loc);
              const mapHintEl = canOpenMap ? (
                <ThemedText className="shrink-0 text-xs text-light-subtext underline dark:text-dark-subtext">
                  {t('productWarehouseMapHint')}
                </ThemedText>
              ) : null;
              return (
                <View
                  key={row.warehouse.id}
                  className="flex-row items-start justify-between border-b border-neutral-100 py-3 last:border-b-0 dark:border-dark-secondary/60">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('productWarehouseOpenMap')}
                    disabled={!canOpenMap}
                    onPress={() => {
                      if (!canOpenMap) return;
                      const centralParam = isMainCentralWarehouse(row.warehouse.name)
                        ? '&mapCentralWarehouse=1'
                        : '';
                      router.push(
                        `/screens/map?mapQuery=${encodeURIComponent(mapQuery)}&mapLabel=${encodeURIComponent(whDisplayName)}${centralParam}`
                      );
                    }}
                    className={`min-w-0 flex-1 pr-3 ${canOpenMap ? 'active:opacity-70' : ''}`}>
                    <ThemedText className="text-sm font-medium text-light-text dark:text-dark-text">
                      {whDisplayName}
                    </ThemedText>
                    {loc && !separateAddress && !addressLineOnly ? (
                      <View className="mt-0.5 flex-row flex-wrap items-baseline gap-x-2">
                        <ThemedText
                          className="min-w-0 shrink text-xs text-light-subtext dark:text-dark-subtext"
                          numberOfLines={2}>
                          {loc}
                        </ThemedText>
                        {mapHintEl}
                      </View>
                    ) : null}
                    {loc && separateAddress ? (
                      <ThemedText className="mt-0.5 text-xs text-light-subtext dark:text-dark-subtext">
                        {loc}
                      </ThemedText>
                    ) : null}
                    {separateAddress || addressLineOnly ? (
                      <View className="mt-0.5 flex-row flex-wrap items-baseline gap-x-2">
                        <ThemedText
                          className="min-w-0 shrink text-xs text-light-subtext dark:text-dark-subtext"
                          numberOfLines={2}>
                          {addr}
                        </ThemedText>
                        {mapHintEl}
                      </View>
                    ) : null}
                  </Pressable>
                  <ThemedText className="shrink-0 text-sm font-semibold text-light-text dark:text-dark-text">
                    {row.quantity} {t('productPiecesAbbr')}
                  </ThemedText>
                </View>
              );
            })}
        </View>
      ) : null}
    </>
  );
}
