# Live Activity (iOS) — zadání a dotazník pro CRM tým

**Datum:** 2026-09-04  
**App:** Real Barber Client (Expo, iOS)  
**Verze app (referenční):** build s 7 stage mapou, LA start **T−90 min**  
**Kontakt app tým:** [doplňte]

---

## 1. Kontext — proč píšeme

V iOS appce běží **Live Activity** (Lock Screen + Dynamic Island) pro nejbližší rezervaci klienta.

**App strana je hotová a otestovaná** pro lokální start/update LA, zrušení, přesun, přechod do „Ohodnoťte“ po otevření app nebo pull refresh.

**Pro produkční UX bez otevírání app** potřebujeme, aby CRM posílalo **ActivityKit remote push** (APNs) na tokeny, které app registruje. Bez toho se stage na lock screenu mění jen když:
- uživatel otevře app (sync z API), nebo
- běží nativní countdown ve widgetu (vizuál uvnitř stejného stage, ne přechod mezi stage 0→1→2…).

Prosíme CRM tým o **potvrzení aktuálního stavu na vaší straně** a případné **srovnání s tímto zadáním** (viz sekce 8).

---

## 2. Co už má app hotové (nic nemusíte dělat na mobilech)

| Oblast | Stav |
|--------|------|
| Start LA lokálně | ✅ T−90 min před `slotStart` (nebo hned, pokud je rezervace blíž) |
| Widget UI (7 stage + výjimky) | ✅ `BookingActivity` |
| Registrace **C1** activity push tokenu | ✅ po startu LA |
| Registrace **C2** push-to-start tokenu | ✅ při loginu / startu app |
| **C3** unregister při logout | ✅ |
| Sync LA při změně bookings v app | ✅ |
| Sync při návratu app do popředí | ✅ |
| Zrušení / přesun z CRM → správné LA po otevření app | ✅ otestováno |
| `completed` → stage „Ohodnoťte“ po refresh v app | ✅ otestováno |

**App nepotřebuje** vlastní handler pro příchozí LA push — iOS aktualizuje widget přímo z APNs, pokud je payload ve správném formátu.

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

## 6. Push-to-start (C2) — volitelné

Pokud CRM podporuje **push-to-start**, může LA spustit **bez otevření app** v T−90.

- Token: C2 (`push-to-start-token`)
- APNs: `apns-push-type: liveactivity`, `event: start`
- `content-state` stejný formát, `props` pro stage **0**

Pokud C2 není implementováno, LA startuje **jen app** (lokálně) — to je OK pro MVP, ale uživatel musí app aspoň jednou otevřít v okně T−90.

---

## 7. Co jsme měli z dřívější komunikace (potřebujeme potvrzení)

Z předchozích vláken / handoffu vycházelo, že CRM **už má nebo mělo**:

- soubory typu `apnsLiveActivity.js`, `liveActivityPushService.js`
- endpoint **C1** `/activitykit-push-token`
- přepis payloadu na **Expo formát** (`content-state.name` + stringified `props`)
- timeline joby (dříve **T−30**, start, review, end+2h)
- event push při cancel / complete / reschedule

**Neověřeno z naší strany na produkci:**
- zda cron/job queue **běží**
- zda stage mapa je **T−90 / 7 stage**, ne staré T−30 / 4 stage
- zda **C2** a **C3** existují a fungují
- zda testovací push na reálný token projde a widget se vizuálně změní **bez otevření app**

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

## 9. Společný E2E test (až potvrdíte readiness)

1. Klient s TestFlight buildem, přihlášený, rezervace za **> 90 min**.  
2. V T−90 (nebo dříve po otevření app) se objeví LA — app zaregistruje **C1**.  
3. CRM ověří v DB uložený token pro `bookingId`.  
4. **Bez otevření app** CRM pošle update (např. stage 1 v T−60).  
5. Lock screen / Dynamic Island se změní (titulek „Brzy začínáme“, CTA Navigovat).  
6. Opakovat pro stage 2–6 a pro cancel z recepce.

**Kritérium úspěchu:** vizuální změna LA na lock screenu **do 1 min** od CRM push, app zavřená v pozadí.

---

## 10. Technické reference (app repo)

| Soubor | Účel |
|--------|------|
| `api/liveActivityPush.ts` | C1/C2/C3 klient |
| `utils/liveActivityPushTokens.ios.ts` | registrace tokenů |
| `utils/bookingLiveActivityData.ts` | stage výpočet + `BookingActivityProps` |
| `utils/bookingLiveActivityStages.ts` | offsety T−90…0, copy |
| `utils/bookingLiveActivitySync.ios.ts` | lokální start/update/end |
| `widgets/BookingActivity.tsx` | SwiftUI widget |
| `docs/live-activity-handover.md` | QA stav app strany |

---

## 11. Shrnutí priority pro CRM

| Priorita | Úkol |
|----------|------|
| **P0** | Potvrdit stav + Expo payload formát + C1 live |
| **P0** | Srovnat stage mapu na **T−90, stage 0–6** |
| **P0** | Spolehlivý scheduler nebo event push pro stage přechody |
| **P1** | Event push: cancel, reschedule, completed → review |
| **P2** | C2 push-to-start (LA bez otevření app) |
| **P2** | C3 cleanup, monitoring failed APNs |

---

*Dokument připraven app týmem pro synchronizaci s CRM. Po vaší odpovědi na sekci 8 upřesníme společný test termín.*
