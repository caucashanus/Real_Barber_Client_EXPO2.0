# Magic link — správa rezervace (app 2.3.2+)

CRM URL (beze změny): `https://realbarber.cz/reservation-manage/{id}?key={secret}`

## Fáze 0 — stav UL (produkce)

**Manage UL zatím ne:** `/reservation-manage/*` není v produkční AASA ani v Android intent filters ve starých store buildech. Po nasazení app **2.3.2+** koordinovat s webem přidání path do AASA (viz fáze 3).

## Fáze 1 — nativní manage (app)

- Route: `/screens/reservation-manage?id={uuid}&key={secret}` (key jen jednorázově z URL → Secure Store)
- Přihlášený + `GET /api/client/bookings/{id}` OK → redirect na `/screens/booking-detail`
- Guest → `GET /api/public/reservations/{id}` + header `X-Reservation-Secret`
- Confirm / cancel / UI parita s booking detailem (`resolveClientBookingSpotlightPresentation`, confirm sekce, footer)
- **Bez Universal Links** lze testovat: dev menu, `xcrun simctl openurl`, nebo in-app navigace

## Fáze 2 — deep link routing (app)

- `resolveWebPath`: `/reservation-manage/{id}` → `/screens/reservation-manage?id=…` (+ query)
- Android: `pathPrefix` `/reservation-manage` v `app.json` / manifest
- iOS: entitlement `applinks:realbarber.cz` už je; handler v app

## Fáze 3 — web (AASA)

Po internal / TestFlight ověření požádat web o:

- `APP_LINK_PATHS` + live AASA: `/reservation-manage/*`
- **Pozor iOS:** nová AASA path platí pro všechny instalace s associated domain — staré buildy bez nativního manage by měly mít in-app fallback (Safari) nebo min. verze ve store.

Reference web: `docs/crm-booking-confirm-web.md`, `PublicReservationManageView`.
