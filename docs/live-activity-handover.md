# Live Activity (iOS) — handover & QA stav

**App:** Real Barber Client (Expo)  
**Platforma:** iOS (Lock Screen + Dynamic Island). Android = stub (`bookingLiveActivitySync.android.ts`).  
**Poslední update:** 2026-09-04

---

## Klíčové soubory

| Soubor | Role |
|--------|------|
| `utils/bookingLiveActivitySync.ios.ts` | Start / update / end LA, timery, exception flow |
| `utils/bookingLiveActivityData.ts` | Stage výpočet, props pro widget, pick rezervace |
| `utils/bookingLiveActivityStages.ts` | Stage 0–6, offsety T−90…0, copy |
| `widgets/BookingActivity.tsx` | SwiftUI widget (banner + Dynamic Island) |
| `contexts/BookingsBadgeContext.tsx` | Trigger sync po `getBookings` |
| `utils/liveActivityPushTokens.ios.ts` | C1/C2 push token registrace |

---

## ✅ Otestováno (2026-09-04)

| # | Scénář | Výsledek |
|---|--------|----------|
| — | Nová rezervace → LA start **T−90 min** | ✅ OK |
| — | Rezervace **&lt; 90 min** před termínem → LA hned | ✅ OK |
| **1** | Zrušení **z appky**, LA běží, app na popředí | ✅ LA → **„Termín byl právě zrušen“** |
| **2** | Zrušení **z recepce/CRM**, app na popředí | ✅ stejně jako Test 1 |
| **3** | Zrušení z recepce, app v **pozadí** → návrat do app | ✅ po otevření app správně zrušeno |
| **Completed → review** | CRM `completed`, pull refresh v app | ✅ LA → **„Ohodnoťte dnešní návštěvu“** (fix sync 2026-09-04) |

### ⏭️ Přeskočeno

| # | Scénář | Poznámka |
|---|--------|----------|
| **4** | Kill app (swipe away) se zobrazenou LA | Volitelný — neprováděno |

---

## 🔲 Doporučené pořadí dalšího testování / práce

Logika: nejdřív **časová osa jedné návštěvy** (app-only, bez CRM push), pak **výjimky**, pak **CRM integrace**.

### Fáze A — Happy path (jedna rezervace, celý den)

1. **Stage 0 → 1** (T−90 → T−60): countdown, copy „Počítáme s vámi“ / „Brzy začínáme“, CTA Navigovat  
2. **Stage 2–4** (T−20, T−10, T−5): barber, inspirace, nápoje — tap deep linky  
3. **Stage 5** (slot start → slot end): „Právě probíhá“  
4. **Stage 6 — review** (po `completed` v CRM nebo po `slotEnd`): „Ohodnoťte“, deep link na `/screens/review`, auto-dismiss do 2 h — **✅ otestováno**  

### Fáze B — Výjimky (částečně hotovo)

5. **Přesun termínu** (CRM/app): LA → „Termín byl právě změněn“ + nový termín, linger 2 h  
6. ~~Zrušení~~ — viz otestováno výše  

### Fáze C — CRM push (C1 ActivityKit)

7. CRM pošle push update na registrovaný token → LA se změní **bez otevření app**  
8. Push-to-start (C2) — LA start z CRM (pokud je zapnuto na backendu)  

### Fáze D — Edge cases (nízká priorita)

9. Kill app + LA pořád na lock screenu (Test 4)  
10. Více budoucích rezervací — LA vždy jen pro **nejbližší**  
11. Dev hot reload — ztráta `activityRef` v JS vs. widget na iOS  

---

## Chování zrušení (reference)

Při zrušení/přesunu s běžící LA:

1. `syncBookingLiveActivityFromBookings` detekuje `cancelled` / `rescheduled`  
2. `end(after(+2h), exceptionProps)` — finální UI na lock screenu  
3. Push token odpojen; stejná rezervace se 2 h nespouští znovu  

Copy zrušení: titulek **„Termín byl právě zrušen“**, status **„RB · Zrušeno“**, tap → booking detail.

---

## Známá křehkost v kódu (pro budoucí hardening)

- Exception handler spoléhá na `activityRef` v paměti JS — po restart app / hot reload může být null, i když iOS LA ještě zobrazuje.  
- Foreground sync v `BookingsBadgeContext` při `AppState.active` **nerefreshuje** API — jen sync starého `bookings` (zrušení z recepce může zpožděně reagovat, dokud neproběhne refresh).  
- Detekce cancel: jen `cancelled` / `canceled` v `status` (ne české varianty).  

*Pozn.: Testy 1–3 v aktuálním buildu prošly — výše jsou preventivní poznámky.*

---

## Stage mapa (T = začátek slotu)

| Stage | Offset | Titulek (zkráceně) |
|-------|--------|---------------------|
| 0 | T−90 | Počítáme s vámi |
| 1 | T−60 | Brzy začínáme (+ Navigovat) |
| 2 | T−20 | Kdo se o vás postará? |
| 3 | T−10 | Katalog účesů → inspirace |
| 4 | T−5 | Káva / limonáda |
| 5 | T−0 … slotEnd | Právě probíhá |
| 6 | po slotEnd / completed | Ohodnoťte (max +2 h) |

LA okno: **T−90 min** až review linger (`BOOKING_LA_START_MS`, `BOOKING_REVIEW_LINGER_MS`).

---

## Kontakt / pokračování

Další krok dle handoveru: **Fáze A, bod 1** — projít stage přechody na reálné rezervaci v okně T−90.
