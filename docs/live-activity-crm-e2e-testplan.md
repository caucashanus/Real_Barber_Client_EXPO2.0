# Live Activity — společný E2E testovací protokol (App + CRM)

**Datum protokolu:** 2026-09-06  
**CRM potvrzení:** 2026-09-06  
**App verze (referenční):** **2.1.0** (Expo SDK 57, TestFlight)  
**Architektura:** **Server-only** — CRM startuje/updatuje/ukončuje LA přes APNs. App **nestartuje LA lokálně**, pouze registruje tokeny C2/C1/C3.

**Testovací účet:** +420774522114 · `clientId` `13100f49-27e3-4a72-b60f-1e6c2d12385a`

---

## CRM potvrzení (2026-09-06)

Protokol bereme jako **společný E2E standard App + CRM**.

**CRM strana ready:**

- C1 / C2 / C3 endpointy live
- APNs **production**
- Cron `POST /api/cron/live-activity/process-planned-starts` (každou minutu)
- Ruční push: `scripts/live-activity-e2e-staging.mjs`
- Monitoring: `[LiveActivity]` log + `apnsId`

**Go/no-go minimum:** testy **A + B + C + D** — souhlasíme.

**Další krok:** Po buildu se stabilnějším C1 domluvit společný test den dle [§4](#4-doporučené-pořadí-testů-1-den).

---

## 0. Baseline — co víme z proběhlých testů

| Oblast | Stav | Důkaz |
|--------|------|-------|
| C2 registrace (push-to-start token) | ✅ Spolehlivé | E2E 2.0.4+ |
| CRM C2 start → LA na lock screenu | ✅ Spolehlivé | E2E 2.0.4+ |
| Widget render (Expo payload) | ✅ Funguje | `33ef088c` |
| C1 registrace (update token) | ⚠️ Nestabilní | 1× OK / 1× fail (stejný build 2.0.5) |
| Stage push s app v pozadí | ⚠️ 1× ověřeno | Jen když C1 v DB |
| Cancel / reschedule / completed push | ⏸ Netestováno | Závisí na C1 |
| Cron stage přechody | ⏸ Netestováno | t60 skip bez C1 |

**Go/no-go MVP (po prvním kole): NE** — potřebujeme stabilní **C (C1a)**.

---

## 1. Příprava (jednorázově)

### App tým

- [ ] TestFlight build **≥ 2.0.5** (po fixu C1 ideálně 2.0.6+)
- [ ] iPhone iOS **17+** (ideálně iOS 18 pro `input-push-token`)
- [ ] Přihlášený testovací účet (viz hlavička)
- [ ] App otevřena alespoň 1× po instalaci (C2 registrace)
- [ ] Xcode / Console.app pro logy `[live-activity]` (doporučené)

### CRM tým

- [ ] Endpointy live: C1, C2, C3
- [ ] APNs production · `apns-topic`: `<bundle-id>.push-type.liveactivity`
- [ ] Payload: Expo formát (`content-state.name: "BookingActivity"`, `props` = stringified JSON)
- [ ] Stage mapa: **T−90, stage 0–6**
- [ ] DB/logy: C1/C2 tokeny per `deviceId` + `bookingId` + `activityId`
- [ ] Ruční push přes `live-activity-e2e-staging.mjs`

### Společně

- [ ] Domluvit testovací booking (rezervace za **> 90 min** nebo create-in-window)
- [ ] Sdílený kanál s `bookingId`, čas slotu, verze app, iOS verze
- [ ] Tabulka výsledků ([§8](#8-tabulka-výsledků))

---

## 2. Co CRM loguje u každého testu

```
timestamp (Europe/Prague)
bookingId · clientId · deviceId · activityId
C1/C2 token (posledních 8 znaků)
APNs event (start / update / end) · stage
HTTP status · apnsId
Log řádek [LiveActivity] { event, reservationId, status, stage, apnsId }
```

**CRM helper:**

```bash
node --env-file=.env scripts/live-activity-e2e-staging.mjs tokens --clientId=13100f49-27e3-4a72-b60f-1e6c2d12385a
node --env-file=.env scripts/live-activity-e2e-staging.mjs push-stage --clientId=... --bookingId=... --stage=1
```

### App logy

| Log | Význam |
|-----|--------|
| `C2 register ok` | C2 na CRM ✅ |
| `C1 adopt instance` | App našla běžící LA |
| `C1 register ok` | C1 na CRM ✅ |
| `adopt skipped — no bookingId` | ❌ bookings/cache |
| `adopt skipped — no running LA instances` | timing |
| `C1 poll exhausted` | ❌ token/activityId nepřišly |

---

## 3. CRM upřesnění k protokolu

| Bod | Upřesnění |
|-----|-----------|
| **C2 start** | Kromě T−90 cronu posíláme C2 i **okamžitě při create-in-window** (rezervace uvnitř T−90) |
| **`input-push-token: 1`** | CRM už posílá na `event: start` — viz `buildLiveActivityApsPayload`. Neposílá token na server automaticky; pomáhá generaci C1 na zařízení |
| **Start alert body** | CRM default: **„Počítáme s vámi“** |
| **Cancel copy** | `lockScreenTitle: "Termín byl právě zrušen"`, `stageKind: cancelled` + `end` (dismissal +2h) |
| **Reschedule copy** | `"Termín byl právě změněn"` |
| **TEST C1b** | CRM nedostane C1 od Apple — POST na `/activitykit-push-token` musí udělat **app**. C1b bez otevření app = vysoké riziko fail — zaznamenat zvlášť |
| **Cron joby** | t90 (start) · t60→stage 1 · t20→2 · t10→3 · t5→4 · t0→5 · review→6 · dismiss→end |

---

## 4. Testovací scénáře

Každý test = samostatná rezervace, ať se výsledky nepřekrývají.

### TEST A — C2 registrace

| | |
|--|--|
| **Precondition** | User přihlášen, app otevřená |
| **Kroky app** | Otevřít app, počkat 10 s |
| **Kroky CRM** | Zkontrolovat DB: C2 token pro `deviceId` |
| **Pass** | C2 token v DB do **30 s** |
| **App log** | `C2 register ok` |

### TEST B — CRM C2 start → LA

| | |
|--|--|
| **Precondition** | TEST A ✅, rezervace v okně T−90 (cron nebo create-in-window) |
| **Kroky app** | App v background (ne force-quit) |
| **Kroky CRM** | C2 start push (stage 0) |
| **Pass** | LA na lock screenu do **1 min**, stage 0, **1× LA** |

### TEST C — C1 registrace (kritický, go/no-go)

| | |
|--|--|
| **Precondition** | TEST B ✅ |
| **C1a** | User **otevře app** do 2 min po LA |
| **C1b** | User app **neotevře** — iOS wake po C2 |
| **Pass C1a** | C1 v DB do **60 s** |
| **Pass C1b** | C1 v DB do **120 s** (vysoké riziko fail) |
| **App log** | `C1 adopt instance` → `C1 register ok` |

### TEST D — Stage update push (app v pozadí)

| | |
|--|--|
| **Precondition** | TEST C ✅ (C1 v DB) |
| **Kroky CRM** | Ruční update stage 1 (nebo 2) |
| **Pass** | Lock screen / DI změna do **60 s**, app v background |

### TEST E — Automatický cron

| | |
|--|--|
| **Precondition** | TEST C ✅ |
| **Pass** | Stage přechod v **±2 min** od plánovaného času (např. T−60 → stage 1) |

### TEST F — Cancel z recepce

| | |
|--|--|
| **Precondition** | LA běží, C1 v DB |
| **Pass** | „Termín byl právě zrušen“ do **1 min** |

### TEST G — Reschedule

| | |
|--|--|
| **Pass** | „Termín byl právě změněn“ + nový čas do **1 min** |

### TEST H — Completed → review (stage 6)

| | |
|--|--|
| **Pass** | Stage 6 „Ohodnoťte dnešní návštěvu“ do **1 min** |

### TEST I — End LA

| | |
|--|--|
| **Pass** | LA zmizí do **5 min** po `event: end` |

### TEST J — Logout → C3 cleanup

| | |
|--|--|
| **Pass** | Tokeny invalidated v DB |

### TEST K — Force-quit → C1 po restartu

| | |
|--|--|
| **Očekávání** | Push před otevřením nemusí projít; po otevření C1 re-adopt |

---

## 4. Doporučené pořadí testů (1 den)

```
Den 1 ráno:  Rezervace za 2+ h → TEST A
Den 1 T−90:  TEST B → hned TEST C (C1a; C1b na druhé rezervaci)
Den 1 T−60:  TEST D (ruční) + TEST E (cron)
Den 1 odpo:  TEST F (cancel), pokud C projde
Den 2:       TEST G, H, I, J, K
```

**Minimum pro go/no-go:** A → B → C1a → D.

---

## 5. Kritéria „co umíme“ po testech

| Výsledek | Závěr |
|----------|--------|
| A+B ✅, C ❌ | LA se objeví, stage se **nemění** — blocker C1 |
| A+B+C+D ✅ | **MVP funguje** |
| E ❌ | Cron/scheduler na CRM |
| F/G/H ❌ | Event push na CRM |
| C1b ❌, C1a ✅ | UX: „Po LA otevřete app“ nutné |

### CRM verdict po prvním kole (2026-09-06)

| Výsledek | Závěr |
|----------|--------|
| A + B ✅ | Server-only start funguje |
| C ⚠️ | 1× OK / 1× fail (2.0.5) — **blocker** |
| D ✅ (1×) | Push v pozadí funguje **jen s C1** |
| E–I | Netestováno — CRM logika ready, závisí na C |
| **Go/no-go MVP** | **NE** |

---

## 6. API reference (app → CRM)

| ID | POST | Body |
|----|------|------|
| **C1** | `/api/client/live-activity/activitykit-push-token` | `{ bookingId, activityId, pushToken, deviceId?, appVersion? }` |
| **C2** | `/api/client/live-activity/push-to-start-token` | `{ pushToken, deviceId?, appVersion? }` |
| **C3** | `/api/client/live-activity/unregister-token` | `{ activityId?, pushToStart: true, deviceId? }` |

---

## 7. Co CRM / app dodá při failu

- `[live-activity]` log export (~5 min kolem testu)
- Přesný čas otevření/zavření app
- iOS verze, model, TestFlight build number
- Screenshot lock screenu před/po push

---

## 8. Tabulka výsledků

### Vyplněno z proběhlých E2E (baseline 2026-09-06)

| Test | Datum/čas | bookingId | App | iOS | C1 v DB? | Výsledek | Poznámka |
|------|-----------|-----------|-----|-----|----------|----------|----------|
| A C2 | 4. 9. ~18:53 | — | 2.0.4 | ? | — | ✅ | device `rb-1788540791800-…` |
| A C2 | 4. 9. ~19:22 | — | 2.0.5 | ? | — | ✅ | device `rb-1788542536541-fnbb4pc6wb` |
| A C2 | 6. 9. ~16:53 | — | 2.0.5 | ? | — | ✅ | stejný device 2.0.5 |
| B C2 start | 4. 9. ~18:56 | `15604f29-a582-4434-9f72-5dcb7f0b341a` | 2.0.4 | ? | — | ✅ | create-in-window, 1× LA |
| B C2 start | 4. 9. ~19:24 | `33ef088c-ad65-46e4-adef-fcd0812c5f1c` | 2.0.5 | ? | — | ✅ | create-in-window, 1× LA |
| B C2 start | 6. 9. ~16:03 | `1a0c7369-8e93-4754-8e0d-92381796a60f` | 2.0.5 | ? | — | ✅ | create-in-window, 1× LA |
| C C1 | 4. 9. ~18:57 | `15604f29-…` | 2.0.4 | ? | ❌ | ❌ | minuty na popředí, 0 řádků |
| C C1 | 4. 9. ~19:26 | `33ef088c-…` | 2.0.5 | ? | ✅ | ✅ | C1a · activityId `C4F5164E-…` |
| C C1 | 6. 9. ~16:05 | `1a0c7369-…` | 2.0.5 | ? | ❌ | ❌ | C1a · 3+ min, kill+reopen |
| C C1b | — | — | — | — | — | ⏸ | netestováno |
| D stage push | 4. 9. ~19:26 | `33ef088c-…` | 2.0.5 | ? | ✅ | ✅ | CRM ručně stage 2 · HTTP 200 · apnsId `2B478D61-…` |
| E cron | — | — | — | — | — | ⏸ | t60 bez C1 = skip; s C1 netestováno |
| F cancel | — | — | — | — | — | ⏸ | vyžaduje C1 |
| G reschedule | — | — | — | — | — | ⏸ | vyžaduje C1 |
| H completed | — | — | — | — | — | ⏸ | vyžaduje C1 |
| I end | — | — | — | — | — | ⏸ | |
| J logout C3 | — | — | — | — | — | ⏸ | |
| K force-quit | — | — | — | — | — | ⏸ | |

### Další kolo (po stabilním C1 buildu)

| Test | Datum/čas | bookingId | App | iOS | C1 v DB? | Výsledek | Poznámka |
|------|-----------|-----------|-----|-----|----------|----------|----------|
| A C2 | | | | | — | ☐ ✅ ☐ ❌ | |
| B C2 start | | | | | — | ☐ ✅ ☐ ❌ | |
| C C1 | | | | | ☐ ano ☐ ne | ☐ ✅ ☐ ❌ | C1a / C1b |
| D stage push | | | | | | ☐ ✅ ☐ ❌ | stage: |
| E cron | | | | | | ☐ ✅ ☐ ❌ | |
| F cancel | | | | | | ☐ ✅ ☐ ❌ | |
| G reschedule | | | | | | ☐ ✅ ☐ ❌ | |
| H completed | | | | | | ☐ ✅ ☐ ❌ | |
| I end | | | | | | ☐ ✅ ☐ ❌ | |
| J logout C3 | | | | | | ☐ ✅ ☐ ❌ | |
| K force-quit | | | | | | ☐ ✅ ☐ ❌ | |

---

## 9. Další krok — společný test den

Po buildu se stabilním C1 (app tým):

1. Nová rezervace za **2+ h**
2. **B → C1a → D** (minimum)
3. **F (cancel)** ve stejný den, pokud C projde
4. CRM online — stačí `bookingId` + signál „app v pozadí“

---

*Související: `docs/live-activity-crm-zadani.md` (technické zadání), `docs/live-activity-handover.md` (QA app strany).*
