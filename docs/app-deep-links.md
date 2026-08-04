# Deep linky — mobilní app (handoff pro web)

Web spec: `seo-starter-2/docs/app-deep-links.md`

## Co je nastaveno v appce (MVP)

| Položka | Hodnota |
|---|---|
| Produkční doména | `realbarber.cz` |
| QR / smart URL | `https://realbarber.cz/aplikace/stahnout` |
| Custom scheme (push, widget) | `realbarber://` — beze změny |
| iOS Associated Domains | `applinks:realbarber.cz` |
| Android App Links | `https://realbarber.cz/aplikace/*` (`autoVerify: true`) |
| Expo Router origin | `https://realbarber.cz` |
| Mapování v appce | `/aplikace/stahnout` → `/` (home / login dle auth) |

Soubory:

- `app.json` — associatedDomains, intentFilters, router origin
- `app/+native-intent.tsx` — redirect incoming path
- `constants/deepLinkConfig.ts` — sdílené konstanty
- `ios/RealBarber/RealBarber.entitlements` — associated domains (lokální iOS build)

## Co potřebujeme od web týmu

1. Cutover `realbarber.cz` + live `.well-known` soubory
2. Nastavit `ANDROID_APP_LINK_SHA256` ve Vercel env (viz níže)

## Co posíláme web týmu

## Android SHA-256 fingerprint (pro web tým)

Do `assetlinks.json` musí jít **SHA-256 podpis, kterým je appka podepsaná u uživatelů z Play Store**.

### Varianta A — Google Play Console (doporučeno pro produkci)

Appku stahují z obchodu → fingerprint ber z **App signing**, ne nutně z EAS upload keystore.

1. [Google Play Console](https://play.google.com/console) → **Real Barber** (`com.realbarber.client`)
2. **Release** → **Setup** → **App integrity** (někdy **Test and release → Setup → App signing**)
3. Záložka **App signing**
4. Sekce **App signing key certificate** → zkopíruj **SHA-256 certificate fingerprint**

Formát: `AA:BB:CC:DD:…` (dvojtečky, velká písmena).

### Varianta B — EAS credentials (upload keystore)

Pokud ještě nemáte Play App Signing, nebo chcete ověřit upload klíč:

```bash
cd Real_Barber_Client_EXPO2.0-2
npx eas credentials -p android
```

Postup v menu:

1. **Which build profile?** → `production`
2. **What do you want to do?** → `Keystore: Manage everything needed to build your project`
3. **Keystore** → zobrazí se **SHA256 Fingerprint** — zkopírujte

(Případně **Download existing keystore** → `.jks` + heslo ze stejné obrazovky.)

### Varianta C — ze staženého keystore / AAB

```bash
chmod +x scripts/android-app-link-sha256.sh

# z .jks staženého z EAS (keytool se zeptá na heslo)
./scripts/android-app-link-sha256.sh ~/Downloads/vas-keystore.jks

# nebo z production AAB (přesnější — skutečný podpis)
./scripts/android-app-link-sha256.sh ./build.aab
```

### Co poslat web týmu

Jedna hodnota (Play App signing) stačí pro produkci. Pokud testujete i internal build s jiným podpisem, pošlete obě oddělené čárkou:

```bash
ANDROID_APP_LINK_SHA256="AA:BB:CC:..."
# více fingerprintů:
ANDROID_APP_LINK_SHA256="AA:BB:...,11:22:33:..."
```

Web to nastaví ve Vercel env → `assetlinks.json` se doplní automaticky.

### EAS účet projektu

- Expo project ID: `344f73c8-de32-4770-8c07-62154df9af0c`
- Package: `com.realbarber.client`
- Přihlášený EAS účet: `adamkratky7120` / `caucashanus@gmail.com`

### iOS AASA

- `appID`: `VK8YT9654D.com.realbarber.client`
- `paths`: `/aplikace/stahnout`, `/aplikace/stahnout/`

## Nasazení

1. App build s touto konfigurací (EAS production) — **nativní změna, ne OTA**
2. Web nastaví SHA-256 → assetlinks.json se ověří
3. Cutover webu na `realbarber.cz`
4. E2E test QR na iOS + Android

## Ověření po release

```bash
# Web
curl -sI "https://realbarber.cz/.well-known/apple-app-site-association"
curl -s "https://realbarber.cz/.well-known/assetlinks.json"

# Android (zařízení s appkou)
adb shell pm get-app-links com.realbarber.client
```

## Test v appce (simulátor / zařízení)

```bash
# iOS Simulator
xcrun simctl openurl booted "https://realbarber.cz/aplikace/stahnout"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "https://realbarber.cz/aplikace/stahnout"
```

Funguje až po cutoveru na produkční doméně a novém buildu appky.

## Mimo MVP

Další cesty (booking detail, rezervace) až po stabilizaci MVP — QR path `/aplikace/stahnout` neměnit.
