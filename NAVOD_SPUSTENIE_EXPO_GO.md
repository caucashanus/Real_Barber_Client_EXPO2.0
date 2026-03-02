# Návod na spustenie projektu v Expo Go

Krátky návod pre spustenie aplikácie **Propia** (Real Barber Client) v Expo Go na mobile.

---

## Čo budeš potrebovať

- **Node.js** v18 alebo v20 (odporúča sa v20)
- **npm** (príde s Node.js)
- **Expo Go** v telefóne ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- Počítač a telefón na **rovej sieti Wi‑Fi** (pre LAN) alebo **Expo tunnel** (ak si na rôznych sieťach)

---

## 1. Inštalácia závislostí

V priečinku projektu spusti:

```bash
# Odporúčané: použiť Node v20
nvm use 20

# Inštalácia balíčkov
npm install

# Ak vzniknú problémy s peer dependencies
npm install --legacy-peer-deps
```

---

## 2. Spustenie vývojového servera

```bash
npx expo start -c
```

`-c` vyčistí cache, čo pomáha pri prvom spustení alebo po zmene konfigurácie.

---

## 3. Otvorenie v Expo Go

Po spustení príkazu sa zobrazí **QR kód** v termináli (alebo v prehliadači na `http://localhost:8081`).

- **Android:** Otvor Expo Go → „Scan QR code“ → naskenuj QR kód z terminálu.
- **iOS:** Otvor natívnu **Kameru** → naskenuj QR kód → potvrď otvorenie v Expo Go.

Aplikácia sa načíta v Expo Go.

---

## 4. Ak telefón nevidí projekt (rôzne siete / firewall)

V termináli stlač **`t`** (tunnel) alebo spusti:

```bash
npx expo start -c --tunnel
```

Nainštaluje sa (ak treba) `@expo/ngrok` a projekt pôjde cez tunnel – potom naskenuj nový QR kód v Expo Go. Tunnel funguje aj keď sú počítač a telefón na rôznych sieťach.

---

## Užitočné príkazy

| Príkaz | Popis |
|--------|--------|
| `npm start` alebo `npx expo start` | Štart dev servera |
| `npx expo start -c` | Štart s čistou cache |
| `npx expo start --tunnel` | Štart s tunnelom (pre rôzne siete) |
| `npx expo start --android` | Štart + otvorenie na Android emulátore |
| `npx expo start --ios` | Štart + otvorenie na iOS simulátore |

---

## Riešenie problémov

- **„Unable to resolve module“** → skús `npx expo start -c` a v Expo Go zatvor a znovu otvor projekt.
- **QR kód nefunguje** → skús režim tunnel: `npx expo start -c --tunnel`.
- **Node verzia** → `node -v` by mal byť v18+ (ideálne v20). Pri problémoch: `nvm use 20`.

---

*Projekt: Propia / Real Barber Client (Expo 54)*
