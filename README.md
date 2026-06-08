# Real Barber — klientská aplikace

Mobilní app pro klienty Real Barber (rezervace, peněženka RBC, profil, pobočky). Postaveno na **Expo 55**, **React Native**, **TypeScript**, **NativeWind**, **expo-router**. Backend: CRM API na `https://crm.xrb.cz`.

## Požadavky

- Node.js 20+
- Xcode (iOS) / Android Studio (Android)
- EAS CLI pro produkční buildy

## Instalace

```bash
nvm use 20
npm install --legacy-peer-deps
```

Pro Android mapy vytvoř `.env` v kořeni:

```
GOOGLE_MAPS_ANDROID_API_KEY=tvůj_klíč
```

## Vývoj

```bash
npx expo start -c          # Metro
npm run ios                # simulátor iOS
npm run android            # emulátor Android
npm test                   # unit testy (utils)
npm run typecheck          # TypeScript
npm run lint               # ESLint + Prettier check
```

## Auth flow

1. **Primární:** telefon → SMS OTP → (registrace nebo přihlášení)
2. **Alternativa:** „Místo toho heslo“ v hlavičce login obrazovky
3. **Zapomenuté heslo:** odkaz na obrazovce přihlášení heslem

## Struktura projektu

| Složka | Účel |
|--------|------|
| `app/` | Expo Router — obrazovky a navigace |
| `components/` | Sdílené UI komponenty |
| `api/` | CRM HTTP klient (`fetchCrm`) a endpoint moduly |
| `utils/` | Čistá logika (booking, telefon, rezervace…) |
| `locales/` | Překlady CS / EN |
| `docs/` | Interní checklisty |

Wizard **Moje střihy:** `/screens/haircut-create-start` → `/screens/haircut-create`

Detail rezervace: `/screens/booking-detail?id=…` (legacy redirect: `/screens/trip-detail`)

## CI

GitHub Actions (`.github/workflows/ci.yml`): `typecheck` → `test` → `lint`.

## Release

Verze v `app.json` / EAS. Produkční build:

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```
