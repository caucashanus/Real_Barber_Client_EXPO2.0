# CRM — migrace push / deep link route (trip-detail → booking-detail)

## Shrnutí pro backend / CRM tým

| | Staré | Nové (preferované) |
|---|--------|---------------------|
| **In-app route** | `/screens/trip-detail?id=<uuid>` | `/screens/booking-detail?id=<uuid>` |
| **Deep link (scheme `realbarber`)** | `realbarber://screens/trip-detail?id=<uuid>` | `realbarber://screens/booking-detail?id=<uuid>` |
| **Push payload** | `reservationId` nebo `entityType: reservation` + `entityId` | beze změny — app naviguje na novou route |

## Kompatibilita v appce

- Route **`/screens/trip-detail`** zůstává jako **redirect** na `booking-detail` (query parametry se přenesou).
- Nové push notifikace a kampaně by měly používat **`booking-detail`**.
- Staré linky v e-mailech / SMS / CRM šablonách **nepadnou**, ale doporučujeme postupně aktualizovat.

## Co změnit v CRM

1. **Push notification templates** — cílová URL / deeplink: `realbarber://screens/booking-detail?id={{reservationId}}`
2. **Manuální deeplinky** v adminu — stejná route
3. **Dokumentace pro support** — „Detail rezervace v appce“ = tab Rezervace nebo deep link výše

## Test (manuální)

Viz [push-reservation-deeplink-checklist.md](./push-reservation-deeplink-checklist.md).

Po migraci ověřte obě varianty:

- `realbarber:///screens/booking-detail?id=<platné-id>`
- `realbarber:///screens/trip-detail?id=<platné-id>` (legacy redirect)

## Kontakt v kódu

- Konstanta: `RESERVATION_DETAIL_ROUTE` v `utils/pushNavigation.ts`
- Legacy: `LEGACY_RESERVATION_DETAIL_ROUTE` + `app/screens/trip-detail.tsx` (redirect)
