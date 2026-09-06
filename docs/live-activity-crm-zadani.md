# Live Activity (iOS) — zadání a dotazník pro CRM tým

**Datum:** 2026-09-04 (aktualizace 2026-09-06)  
**App:** Real Barber Client (Expo, iOS)  
**Verze app (referenční):** **2.1.0** — Expo SDK **57**, 7 stage mapa, LA start **T−90 min**, **server-only**  
**E2E protokol + baseline:** [`live-activity-crm-e2e-testplan.md`](./live-activity-crm-e2e-testplan.md)  
**Kontakt app tým:** [doplňte]

---

## 1. Kontext — proč píšeme

V iOS appce běží **Live Activity** (Lock Screen + Dynamic Island) pro nejbližší rezervaci klienta.

**Architektura (2.0.5+): server-only.** CRM vlastní start/update/end LA přes APNs. App **nestartuje LA lokálně** — pouze registruje C2/C1/C3 tokeny a renderuje widget.

**E2E stav (2026-09-06):** CRM potvrdilo readiness (C1/C2/C3, cron, APNs production). **A+B ✅**, **C ⚠️** (1× OK / 1× fail na 2.0.5), **D ✅** (1× s C1). Go/no-go MVP: **NE** — blocker je stabilní C1. Detail: [`live-activity-crm-e2e-testplan.md`](./live-activity-crm-e2e-testplan.md).

Bez registrovaného **C1** se stage na lock screenu **nemění** (jen nativní countdown uvnitř stejného stage).

---

## 2. Co má app hotové (server-only, 2.0.5)

| Oblast | Stav | E2E |
|--------|------|-----|
| **CRM C2 start** → LA na lock screenu | ✅ | A, B |
| Widget UI (7 stage + výjimky) | ✅ | B, D |
| Registrace **C2** push-to-start tokenu | ✅ spolehlivé | A |
| Registrace **C1** activity push tokenu | ⚠️ nestabilní | C: 1× OK / 1× fail |
| **C3** unregister při logout | ✅ kód ready | ⏸ netestováno |
| Adopt LA + C1 poll (login, AppState, 5s interval) | ✅ | C |
| Lokální start/update/end LA z app | ❌ vypnuto | — |

**App nepotřebuje** handler pro příchozí LA push — iOS aktualizuje widget přímo z APNs (Expo payload).

---

## 3. Co potřebujeme od CRM (produkční cíl)

### 3.1 API endpointy pro tokeny

App volá (autentizace: stejný client API token jako ostatní `/api/client/*`):

| ID | Metoda | Path | Body (shrnutí) |
|----|--------|------|----------------|
| **C1** | POST | `/api/client/live-activity/activitykit-push-token` | `{ bookingId, activityId, pushToken, deviceId?, appVersion? }` |
| **C2** | POST | `/api/client/live-activity/push-to-start-token` | `{ pushToken, deviceId?, appVersion? }` |
| **C3** | POST | `/api/client/live-activity/unregister-token` | `{ activityId?, pushToStart: true, deviceId? }` |

**Požadavky na CRM:**
- Uložit token **vázaný na `bookingId` + `activityId` + `deviceId`** (C1).
- C1 token je **jiný než běžný FCM/APNs device token** — jde o ActivityKit update token pro konkrétní běžící LA.
- Po skončení LA / logout tokeny invalidovat (C3).
- C2: volitelné pro **push-to-start** (CRM spustí LA bez otevření app) — viz sekce 6.

### 3.2 APNs odesílání (ActivityKit update)

Pro **update běžící** Live Activity:

```
apns-push-type: liveactivity
apns-topic: <bundle-id>.push-type.liveactivity
apns-priority: 10
```

**Payload — povinný Expo formát** (starý formát s `title`, `progress01` atd. widget neaktualizuje):

```json
{
  "aps": {
    "timestamp": 1699999999,
    "event": "update",
    "content-state": {
      "name": "BookingActivity",
      "props": "<STRING — JSON BookingActivityProps serializovaný jako string>"
    }
  }
}
```

`name` musí být přesně **`BookingActivity`** (název widgetu v app).

Pro **ukončení** LA (volitelné z CRM — app to dělá lokálně při sync):

```json
{
  "aps": {
    "timestamp": 1699999999,
    "event": "end",
    "content-state": {
      "name": "BookingActivity",
      "props": "<STRING — finální props, např. review nebo cancelled>"
    },
    "dismissal-date": 1699999999
  }
}
```

### 3.3 Schéma `BookingActivityProps` (co musí být v `props`)

CRM by ideálně **volalo stejnou logiku jako app** (`buildBookingActivityProps`) nebo posílalo ekvivalentní JSON. Minimální pole:

| Pole | Typ | Popis |
|------|-----|--------|
| `bookingId` | string | ID rezervace |
| `status` | string | Titulek stage (např. „Počítáme s vámi“, „Ohodnoťte“) |
| `stage` | number | **0–6** (viz tabulka níže) |
| `stageKind` | `"normal"` \| `"cancelled"` \| `"rescheduled"` | Výjimky |
| `nowEpochMs` | number | Unix ms — čas sestavení payloadu |
| `soonEpochMs` | number | Začátek LA okna = `appointmentEpochMs − 90 min` |
| `appointmentEpochMs` | number | Začátek slotu |
| `endEpochMs` | number | Konec slotu |
| `branchName`, `employeeName`, `serviceName` | string? | Zobrazení |
| `timeLabel` | string? | Např. „10:00“ |
| `durationMinutes` | number? | Délka služby |
| `subtitle`, `expandedSubtitle` | string? | Podtitulky dle stage |
| `ctaKind` | `"none"` \| `"countdown"` \| `"navigate"` \| `"inspire"` \| `"drinks"` | Stage 5 = **`"none"`** (`duration` je jen legacy v TS typu, widget nepoužívá) |
| `ctaLabel` | string? | Např. „Navigovat“, „Inspirace“ |
| `progressPhase` | `0` \| `1` \| `2` | Progress bar fáze |
| `countdownHours`, `countdownMinutes` | number? | Pro countdown stage |
| `deepLinkUrl` | string? | `realbarber://…` |
| `lockScreenTitle` | string? | Stage 6: „Ohodnoťte dnešní návštěvu“; výjimky: „Termín byl právě zrušen“ |
| `existingReviewRating` | number? | Pokud už hodnoceno, review stage neposílat |

Reference v repu app: `utils/bookingLiveActivityData.ts` → `buildBookingActivityProps`, `utils/bookingLiveActivityStages.ts`.

---

## 4. Stage mapa — **aktuální app (7 stage, T−90)**

⚠️ **Důležité:** Dřívější handoff CRM často uváděl **4 stage a T−30**. App dnes používá **7 stage a T−90**. Pokud CRM scheduler stále počítá T−30 nebo 4 stage, lock screen se **nebude shodovat** s app.

| Stage | Čas (T = `slotStart`) | Titulek | CTA / poznámka |
|-------|------------------------|---------|----------------|
| **0** | T−90 … T−60 | Počítáme s vámi | countdown |
| **1** | T−60 … T−20 | Brzy začínáme | Navigovat → deep link s `openNavigate=1` |
| **2** | T−20 … T−10 | Kdo se o vás dnes postará? | countdown |
| **3** | T−10 … T−5 | Podívejte se na katalog účesů | Inspirace → `realbarber://inspirace` |
| **4** | T−5 … T | Je libo káva nebo limonáda? | Nápoje |
| **5** | T … `slotEnd` | Právě probíhá | `ctaKind: "none"` (délka v `subtitle`, ne CTA tlačítko) |
| **6** | po `slotEnd` nebo `status=completed` | Ohodnoťte | max **+2 h** po `slotEnd`, pak LA skončit |

**LA okno:** od **T−90 min** do **slotEnd + 2 h** (review linger).

**Výjimky (event push, ne čekat na cron):**
- `cancelled` / `canceled` → `stageKind: "cancelled"`, `lockScreenTitle: "Termín byl právě zrušen"`
- přesun termínu → `stageKind: "rescheduled"`, `lockScreenTitle: "Termín byl právě změněn"` + nové časy v subtitle

---

## 5. Dva typy CRM logiky

### A) Plánované push (timeline / cron / job queue)

Pro každou aktivní rezervaci s registrovaným C1 tokenem naplánovat push na:

| Událost | Kdy poslat update (stage) |
|---------|---------------------------|
| LA start | T−90 → stage **0** (pokud LA nestartuje app — viz C2) |
| Stage přechody | T−60 → **1**, T−20 → **2**, T−10 → **3**, T−5 → **4**, T → **5** |
| Review | `slotEnd` → **6**, nebo dříve při `completed` |
| Konec LA | `slotEnd + 2 h` → `event: end` (nebo nechat app lokálně) |

Cron musí běžet **spolehlivě** (ne jen ručně). App **už nepoužívá** JS timery jako zálohu v pozadí.

### B) Event-driven push (okamžitě)

| Událost v CRM | Akce |
|---------------|------|
| Zrušení rezervace | Okamžitý update s `stageKind: cancelled` |
| Přesun termínu | Okamžitý update s `stageKind: rescheduled` + přeplánovat timeline joby |
| Označení `completed` | Update stage **6** (review), i před `slotEnd` |
| Změna barbera / služby / pobočky | Update aktuální stage s novými poli |

---

## 6. Push-to-start (C2) — produkční cesta

CRM spouští LA **bez otevření app**:

- **T−90 cron** nebo **okamžitě při create-in-window** (rezervace uvnitř T−90)
- Token: C2 (`push-to-start-token`)
- APNs: `apns-push-type: liveactivity`, `event: start`
- `content-state` stejný formát, `props` pro stage **0**
- CRM posílá **`input-push-token: 1`** (iOS 18+) — pomáhá generaci C1 na zařízení; token na server stejně posílá **app** (POST C1)
- Start alert body (CRM default): **„Počítáme s vámi“**

Po C2 startu app musí zaregistrovat **C1** (ideálně user otevře app — viz TEST C1a v E2E protokolu).

---

## 7. CRM potvrzení (2026-09-06)

CRM potvrdilo:

- C1 / C2 / C3 endpointy live, APNs **production**
- Cron `POST /api/cron/live-activity/process-planned-starts` (každou minutu)
- Expo payload formát, stage **T−90 / 0–6**
- Cron joby: t90 (start) · t60→1 · t20→2 · t10→3 · t5→4 · t0→5 · review→6 · dismiss→end
- Ruční push: `scripts/live-activity-e2e-staging.mjs`
- Monitoring: `[LiveActivity]` + `apnsId`

**Zbývá ověřit E2E:** stabilní C1, cron stage přechody (E), cancel/reschedule/completed (F–H).

---

## 8. Dotazník pro CRM — prosíme o vyplnění / odpověď mailem

1. **Máte na produkci implementované odesílání ActivityKit push (`apns-push-type: liveactivity`)?** Ano / Ne / Jen staging  
2. **Které endpointy jsou live?** C1 / C2 / C3 — u každého URL + stav  
3. **Ukládáte C1 token per `bookingId` + `activityId`?** Jak řešíte více zařízení u jednoho klienta?  
4. **Jaký formát payloadu posíláte dnes?** Expo (`BookingActivity` + stringified props) nebo starý? Pošlete prosím **ukázkový JSON**.  
5. **Jaká je vaše stage mapa a offsety?** Pošlete tabulku nebo kód — je to **T−90 a stage 0–6**?  
6. **Běží plánovač (cron/queue) pro stage přechody?** Jak často, jaká timezone (Europe/Prague)?  
7. **Posíláte event push** při cancel / reschedule / completed? S jakým zpožděním?  
8. **Máte push-to-start (C2)?** Pokud ano, používáte ho, nebo jen update (C1)?  
9. **APNs prostředí:** sandbox vs production — app TestFlight/App Store používá **production**.  
10. **Můžete na našem testovacím účtu** poslat jeden ruční update push a dát nám **log + timestamp** (bookingId, stage)?  
11. **Co vám chybí od app týmu** (certifikáty, bundle ID, dokumentace, test device token)?

---

## 9. Společný E2E test

Kompletní protokol, baseline tabulka a CRM checklist: **[`live-activity-crm-e2e-testplan.md`](./live-activity-crm-e2e-testplan.md)**.

**Go/no-go minimum:** A (C2) → B (LA start) → C (C1) → D (stage push v pozadí).

**Další kolo:** Po buildu se stabilním C1 — nová rezervace za 2+ h, B → C1a → D, případně F (cancel).

---

## 10. Technické reference (app repo)

| Soubor | Účel |
|--------|------|
| `api/liveActivityPush.ts` | C1/C2/C3 klient |
| `utils/liveActivityPushTokens.ios.ts` | registrace tokenů |
| `utils/bookingLiveActivityData.ts` | stage výpočet + `BookingActivityProps` |
| `utils/bookingLiveActivityStages.ts` | offsety T−90…0, copy |
| `utils/bookingLiveActivitySync.ios.ts` | adopt server LA + C1 (server-only) |
| `widgets/BookingActivity.tsx` | SwiftUI widget |
| `docs/live-activity-handover.md` | QA stav app strany |

---

## 11. Shrnutí priority

| Priorita | Úkol | Strana |
|----------|------|--------|
| **P0** | Stabilní **C1** registrace (C1a) | **App** |
| **P0** | E2E A+B+C+D po fixu C1 | App + CRM |
| **P1** | Cron stage přechody (TEST E) | CRM (ready) |
| **P1** | Event push: cancel, reschedule, completed (F–H) | CRM (ready) |
| **P2** | C3 logout, force-quit (J, K) | App + CRM |

---

*CRM potvrzení a baseline: 2026-09-06. Další krok: app build 2.0.6+ se stabilním C1 → společný test den.*
