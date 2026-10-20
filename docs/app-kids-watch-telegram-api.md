# Hlídání pro děti — nativní app → web BFF → Telegram

Mobilní klient nevolá CRM přímo. Stejně jako čekací listina posílá JSON na **Next.js BFF** (`EXPO_PUBLIC_WEB_ORIGIN`, výchozí `https://realbarber.cz`), který zprávu sformátuje a pošle do Telegramu.

## Endpoint

| | |
|---|---|
| **URL** | `POST {WEB_BFF_ORIGIN}/api/kids-watch/` (včetně trailing slash) |
| **Auth** | `Authorization: Bearer <clientApiToken>` |
| **Content-Type** | `application/json` |

Implementace v app: `lib/kids-watch/postKidsWatch.ts` → `api/kids-watch.ts` → `HomeKidsWatchSheet`.

## Payload

Tělo odpovídá webu (`KidsWatchForm` submit). Builder: `utils/buildKidsWatchSubmitBody.ts`.

| Pole | Popis |
|------|--------|
| `bookingId` | ID rezervace (CRM) |
| `date`, `slot` | Termín z booking |
| `branchName`, `employeeName`, `serviceName` | Volitelné display |
| `usePickupPin`, `pickupPin` | PIN krok |
| `notifyStart`, `notifyEnd` | Příchod / odchod |
| `allowSweetDrink`, `allowCandy`, … | Inverze výběru „na co si dát pozor“ |
| `haircutPhotoUrls` | **HTTPS URL** z CRM media (ne `file://`) |
| `contactPhone`, `preferredContact`, `clientEmail`, `clientName` | Kontakt |
| `contactUseProfileDefaults` | Skip telefonu = profil |
| `note` | Poznámka nebo `null` |
| `isLoggedIn` | App vždy `true` |
| `source` | App vždy `"app"` |

## Fotky

1. Uživatel vybere až 3 fotky (lokální URI).
2. Před submitem app volá `POST /api/client/media` (`uploadClientMedia`) pro každou fotku.
3. Do `haircutPhotoUrls` jdou pouze `media.url` z odpovědi.

Helper: `utils/uploadKidsWatchHaircutPhotos.ts`.

## Odpověď

```json
{ "ok": true, "id": "…" }
```

Chyby: `{ "ok": false, "error": "…" }`. HTTP **502** (Telegram dočasně nedostupný) app bere jako úspěch (best-effort, stejně jako waitlist).

## Env

```bash
EXPO_PUBLIC_WEB_ORIGIN=https://realbarber.cz
```

Pro staging nastav stejnou proměnnou na URL preview webu s nasazeným `/api/kids-watch/`.

## Poznámka k nasazení

Na produkčním webu musí být nasazena route `src/app/api/kids-watch/route.ts` (stejně jako `/api/team-member-waitlist/`). Dokud BFF vrací **404**, app zkusí záložně `POST https://crm.xrb.cz/api/kids-watch` — oba musí být na backendu dostupné, jinak submit skončí chybou.
