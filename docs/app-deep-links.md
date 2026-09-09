# Deep linky — mobilní app (handoff pro web)

Web spec: `seo-starter-2/docs/app-deep-links.md`

## Cíl

Když má uživatel nainstalovanou appku a klikne na URL `realbarber.cz`, která má nativní screen, otevře se **appka** (ne Safari). Bez appky zůstane web.

## Co je nastaveno v appce

| Položka | Hodnota |
|---|---|
| Produkční doména | `realbarber.cz` |
| Homepage | `https://realbarber.cz/` → nativní `/` (home / login dle auth) |
| QR / smart URL | `https://realbarber.cz/aplikace/stahnout` → `/` |
| Team member URLs | `https://realbarber.cz/tym/:slug/` → `/barber-detail?id=:slug` |
| Custom scheme (push, widget) | `realbarber://` — beze změny |
| iOS Associated Domains | `applinks:realbarber.cz` |
| Android App Links | exact `/` + fáze 1 prefixy/paths (`autoVerify: true`) — viz `app.json` |
| Expo Router origin | `https://realbarber.cz` |

Soubory:

- `app.json` — associatedDomains, intentFilters, router origin
- `app/+native-intent.tsx` — redirect incoming path
- `lib/linking/resolveWebPath.ts` — web path → app route
- `constants/deepLinkConfig.ts` — sdílené konstanty
- `ios/RealBarber/RealBarber.entitlements` — associated domains (lokální iOS build)

## AASA — fáze 1 (live na produkci)

Soubor: `https://realbarber.cz/.well-known/apple-app-site-association`  
`appID`: `VK8YT9654D.com.realbarber.client`

```json
[
  "/",
  "/aplikace/stahnout",
  "/aplikace/stahnout/",
  "/tym",
  "/tym/*",
  "/sluzby",
  "/sluzby/*",
  "/inspirace",
  "/cenik",
  "/kontakty",
  "/branches/*",
  "/mapa",
  "/rezervace",
  "/rezervace/*",
  "/promo/*",
  "/gdpr",
  "/ochrana-osobnich-udaju",
  "/ochrana-osobnich-udaj",
  "/login"
]
```

### Důležité

- **Nedávejte** `"/*"` ani `"*"` — to by stáhlo celý web (blog, kariéra…) do appky.
- Path `/` = **jen homepage**, ne celý web.
- `/inspirace` ANO; `/inspirace/*` NE (legacy → web `/sluzby/*`).
- EN/UK listing slugy (`/team`, `/services`…) zatím neclaimujeme.
- Bez instalované appky URL dál fungují jako web.
- Ověření: `curl -s https://realbarber.cz/.well-known/apple-app-site-association`

### Android `assetlinks.json`

Už běží (package `com.realbarber.client` + SHA-256). SHA musí zůstat platný (Play App Signing). Intent filters musí odpovídat AASA fázi 1 (nový **native** build, ne OTA).

## Co mapuje appka (až OS URL předá)

| Web URL | App route |
|---|---|
| `/` | `/` (home / login) |
| `/aplikace/stahnout` | `/` |
| `/tym` | `/experience` |
| `/tym/{slug}/` | `/barber-detail?id={slug}` |
| `/sluzby` | `/services` |
| `/sluzby/{slug}/` | `/hairstyle-detail?id={slug}` |
| `/inspirace` | `/inspirace` |
| `/cenik` | `/services` |
| `/kontakty` | `/branches` |
| `/branches/{slug}/` | `/branch-detail?id={slug}` |
| `/mapa` | `/screens/map` |
| `/rezervace`, `/rezervace/*` | `/screens/reservation-create` |
| `/promo/poster\|kupon/{id}` | `/promo/...` |
| `/gdpr`, `/ochrana-osobnich-udaju(j)` | privacy screen |
| `/login` | `/screens/login` |

**WEB_ONLY** (ne v AASA): blog, novinky, FAQ, O nás, kariéra, SEO landings, `/r/*`, `/prehled`, `/menu`, `/inspirace/*`, …

**Fáze 2** (až app doplní mapování + AASA): `/u/*/…`, `/rozvrh`, `/mapa/filtry`

## Nasazení

1. **Web:** AASA fáze 1 — ✅ live
2. **App:** EAS production build (nativní změna intent filters — **ne OTA**)
3. TestFlight / Play → E2E ze Notes / Messages / Chrome (ne jen adresní řádek Safari)

## Ověření

```bash
curl -s "https://realbarber.cz/.well-known/apple-app-site-association"

# In-app routing (nepravý Universal Link)
xcrun simctl openurl booted "https://realbarber.cz/"
xcrun simctl openurl booted "https://realbarber.cz/tym/andrea/"
xcrun simctl openurl booted "https://realbarber.cz/inspirace"
xcrun simctl openurl booted "https://realbarber.cz/sluzby/"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "https://realbarber.cz/inspirace"
adb shell pm get-app-links com.realbarber.client
```

**Skutečný test:** na zařízení s nainstalovanou appkou kliknout odkaz z Notes / Messages / jiné appky (ne jen adresní řádek Safari).

## Android SHA-256 fingerprint (pro web tým)

Do `assetlinks.json` musí jít **SHA-256 podpis, kterým je appka podepsaná u uživatelů z Play Store**.

### Varianta A — Google Play Console (doporučeno pro produkci)

1. [Google Play Console](https://play.google.com/console) → **Real Barber** (`com.realbarber.client`)
2. **Release** → **Setup** → **App integrity** / **App signing**
3. **App signing key certificate** → **SHA-256 certificate fingerprint**

### Varianta B — EAS credentials

```bash
npx eas credentials -p android
```

### Co poslat web týmu

```bash
ANDROID_APP_LINK_SHA256="AA:BB:CC:..."
```

- Expo project ID: `344f73c8-de32-4770-8c07-62154df9af0c`
- Package: `com.realbarber.client`
- Apple Team: `VK8YT9654D`
