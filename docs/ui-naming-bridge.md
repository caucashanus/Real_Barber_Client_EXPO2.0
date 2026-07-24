# UI naming bridge — web ↔ app (Expo)

Mapování design systému mezi webem a nativní appkou. **Vzhled se tím nemění** — sjednocujeme názvy, strukturu a kontrakt. Implementace (RN / SwiftUI / web) může být jiná.

Při každé nové globální web komponentě přidej řádek do tabulek níže.

---

## Pravidla

1. **Web názvy = design system** — app **drží stejné identifikátory** pro building blocks.
2. **Feature názvy mohou zůstat** (`BookingCard`, `BookingDetailFooterActions`, …) — vizuální vrstvy uvnitř ale skládáme z názvů níže.
3. **Nepoužívat paralelní názvy** místo building blocks: `ReservationCardShell`, `AppListCard`, `GrayFooterCard`, `DetailFooterBar`, …
4. **Náš `Card` (media) ≠ web `Card` (surface)** — v diskuzi vždy upřesnit.
5. **Ne hex ve feature kódu** — `#0F0F0F`, `#262626`, `#25D366` … → tokeny / varianty / **`ChannelCtaId`**.
6. Refactor app kódu (soubory `ContentCard.tsx`, `channelCta.ts` …) až později — dokud u App není „✅ komponenta“.

---

## Vrstvy a názvy (web = app identifikátory)

| Název | Vrstva | Soubor (web) | Význam |
| --- | --- | --- | --- |
| **`Card`** | UI primitivum (shadcn) | `src/components/ui/card.tsx` | Povrch karty + varianty |
| **`CardContent`** | slot `Card` | totéž | Tělo / obsahová zóna |
| **`CardFooter`** | slot `Card` | totéž | Spodní zóna uvnitř karty (akční lišta) |
| **`CardTitle`** | typografie | totéž | Primární titulek v těle |
| **`CardDescription`** | typografie | totéž | Sekundární text (muted) |
| **`ContentCard`** | shared shell | `src/components/shared/content-card.tsx` | `Card` + body + optional footer |
| **`ContentCardActions`** | shared | totéž | Split akce (2+ tlačítka, svislá čára) |
| **`ContentCardActionBar`** | shared | totéž | Šedý zaoblený bar **mimo kartu** (sticky detail) |
| **`contentCardFooterActionClass`** | layout helper | totéž | Layout footer CTA (`flex-1`, `rounded-none`, …) — **ne barvy** |

**App pravidlo:** pattern = **`ContentCard`**, povrch = **`Card` variant**, footer akce = **`ContentCardActions`** + **`Button` `ghost`**. Sticky mimo kartu = **`ContentCardActionBar`**.

---

## Skladba (diagram)

### Seznam (feature list item)

```
BookingCard / AccountReservationListItem
  └── ContentCard (variant: inset)
        ├── CardContent (+ CardTitle / CardDescription)
        └── CardFooter? → ContentCardActions → Button ghost × 2
```

### Detail sticky (feature footer)

```
BookingDetailFooterActions / AccountReservationDetailFooter
  └── fixed wrapper → ThemedFooter (bg-background, safe-area)   ← layout obrazovky, ne design název
        └── ContentCardActionBar   ← bg-card, rounded-2xl
              └── ContentCardActions
                    └── Button ghost × N
```

### Hodnocení (web: inset karta + sticky bar)

```
review.tsx (feature)
  └── ContentCard inset (tělo formuláře) — zatím bez dedikovaného shellu
  └── ThemedFooter → ContentCardActionBar → ContentCardActions → Button ghost
        (Odeslat | Upravit + Smazat)
```

---

## `Card` varianty (povrch)

Zdroj web: `cardVariants` v `src/components/ui/card.tsx`.

| `variant` | Účel | Tokeny (dark) | Border / radius |
| --- | --- | --- | --- |
| **`default`** | běžná šedá karta, booking pickery | `bg-card` ≈ `#262626` | bez borderu, `rounded-2xl` |
| **`inset`** | seznam rezervací — černé tělo | `bg-background` ≈ `#0F0F0F` | `1px` `border-border`, `rounded-2xl` |
| **`light`** | světlý obsah / SEO | světlý `bg-card` | bez borderu |
| **`outline`** | ohraničená / media-ish | `bg-card` + ring | `ring-1`, `rounded-xl` |

| Variant | App — kde dnes | Status |
| --- | --- | --- |
| **`inset`** | `BookingCard` shell — `app/(tabs)/bookings.tsx` | mapováno |
| **`default`** | `BookingPanelPickerRow` — `components/booking/engine/` | mapováno |
| **`light`** | — | nemapováno |
| **`outline`** | — | nemapováno |

---

## Vizuální kontrakt (referenční hodnoty)

### Tělo — `CardContent`

| | |
| --- | --- |
| Padding | **20 px** (`p-5`) |
| Role | klikací obsah / shrnutí entity |

### Footer **uvnitř** karty — `CardFooter`

| | |
| --- | --- |
| Pozadí | **`bg-card`** ≈ `#262626` — i když tělo je `inset` (černé) |
| Oddělovač | `border-t` `border-border-subtle` |
| Padding shellu | `0` — padding nesou tlačítka |

### `ContentCardActions`

| | |
| --- | --- |
| Layout | `flex-row`, children **`flex-1`** |
| Divider | **1 px** svisle, `bg-border`, přes celou výšku lišty |
| Tlačítka | **`Button ghost`** + `contentCardFooterActionClass` |
| Typografie | `font-semibold`, ~`py-3.5`, **`rounded-none`** |
| Destruktivní | stejný `ghost` + **`text-destructive`** |

### `ContentCardActionBar` (sticky / mimo kartu)

| | |
| --- | --- |
| Povrch | `bg-card` ≈ `#262626`, `rounded-2xl`, `overflow-hidden` |
| Uvnitř | status text **nebo** `ContentCardActions` |
| Vnější wrapper | `bg-background`, safe-area — **jen layout** (`ThemedFooter`) |

---

## Mapování komponent — app (Expo)

| Design system | App — kde to dnes je | Poznámka |
| --- | --- | --- |
| **`ContentCard`** | inline v `BookingCard` — `bookings.tsx` | Tělo + footer v jedné kartě |
| **`ContentCard` `inset`** | `BookingCard` (`border`, `rounded-2xl`) | Seznam rezervací |
| **`ContentCard` `default`** | `BookingPanelPickerRow` | Booking pickery |
| **`CardContent`** | `Pressable` + `p-5` v `BookingCard` | |
| **`CardFooter`** | footer `View` v `BookingCard` | Součást karty, `rounded-b-2xl` |
| **`CardTitle` / `CardDescription`** | `ThemedText` v těle karty | |
| **`ContentCardActions`** | `flex-row` + `w-px` + `Button ghost` v `BookingCard` | Seznam |
| **`ContentCardActions`** | stejný pattern v `BookingDetailFooterActions` | Detail |
| **`ContentCardActionBar`** | `View rounded-2xl bg-light-secondary` v `BookingDetailFooterActions` | |
| **`ContentCardActionBar`** | stejný pattern v `review.tsx` (`ThemedFooter`) | Hodnocení |
| sticky wrapper | `ThemedFooter` — `components/ThemeFooter.tsx` | Safe area + `px-global` |
| **`Button` `ghost`** | `components/Button.tsx` | ✅ shodný název |
| **`text-destructive`** | dnes `text-red-*` v `BookingDetailFooterActions`, `review.tsx` | **Gap:** zavést token |
| `contentCardFooterActionClass` | `flex-1 rounded-none px-0 py-3.5` na footer `Button` | |
| **`Card` (media)** | `components/Card.tsx` | **≠ web surface `Card`** |
| `CustomCard` | `components/CustomCard.tsx` | Obecný obal — není `ContentCard` |

### Feature obálky (název může zůstat)

| Web feature | App feature | Building blocks uvnitř |
| --- | --- | --- |
| `ReservationCard` | `BookingCard` | `ContentCard inset` + footer |
| `AccountReservationDetailFooter` | `BookingDetailFooterActions` | `ContentCardActionBar` + `ContentCardActions` |
| `AccountReservationReviewView` | `review.tsx` | inset tělo + sticky `ContentCardActionBar` |

### Footer v kartě vs. `ContentCardActionBar`

| | **`ContentCard` footer** | **`ContentCardActionBar`** |
| --- | --- | --- |
| Kde | Seznam (`BookingCard`) | Detail, hodnocení |
| Vztah ke kartě | **Součást** karty | **Mimo** kartu, sticky |
| Skládá se z | `ContentCardActions` | `ContentCardActions` nebo status text |
| Wrapper | — | `ThemedFooter` |

---

## Kde na webu / v appce

| Obrazovka | Web | App | Shell | Akce |
| --- | --- | --- | --- | --- |
| Seznam rezervací | `ReservationCard` | `BookingCard` | **`ContentCard` `inset`** | footer: 2× `ghost` |
| Detail rezervace | `AccountReservationDetailFooter` | `BookingDetailFooterActions` | **`ContentCardActionBar`** sticky | viz stavy |
| Hodnocení | `AccountReservationReviewView` | `review.tsx` | **`ContentCard` `inset`** + sticky bar | Odeslat / Upravit+Smazat |
| Booking pickery | `SitePanelItemRow layout="card"` | `BookingPanelPickerRow` | **`ContentCard` `default`** | 1× `ghost` |

---

## Stavy footeru — logika

### Seznam — footer **uvnitř** `ContentCard`

| Stav | Levé CTA | Pravé CTA | App |
| --- | --- | --- | --- |
| Nadcházející | Zobrazit | Přesunout (+ kalendář OK) | `BookingCard` |
| Minulá, bez recenze | Zobrazit | Napsat recenzi (bez hvězdy) | `tripsAddReview` |
| Minulá, s recenzí | Zobrazit | hvězdy (rating) | `ShowRating` |
| Zrušená | bez footeru; karta `opacity-70` | — | `isCancelled` |

### Detail — sticky `ContentCardActionBar`

| Stav | Obsah baru | App |
| --- | --- | --- |
| Zrušená | text `text-destructive` (bez tlačítek) | `isCancelled` |
| Probíhá | live tečka + „Probíhá“ | `LiveIndicator`, `isCurrent` |
| Minulá | Opakovat \| Napsat/Upravit recenzi | `isPast` — app: `branchReview` / `reviewUpdate` + ikona hvězdy (**gap vs web** bez hvězdy u „Napsat“) |
| Nadcházející | Přesunout \| Zrušit (`text-destructive`) | `isUpcoming` |

---

## i18n — web `Auth.*` ↔ app

| Web klíč (`Auth.*`) | CS (web) | App klíč | CS (app) |
| --- | --- | --- | --- |
| `reservationsFooterAddReview` | Napsat recenzi | `tripsAddReview` | Napsat recenzi |
| `reservationsFooterEditReview` | Upravit recenzi | `reviewUpdate` | Upravit recenzi |
| `reservationsFooterReschedule` | Přesunout | `bookingDetailMoveButton` | Přesunout |
| `reservationsFooterCancel` | Zrušit | `bookingDetailCancelButton` | Zrušit |
| `reservationsFooterRepeat` | Opakovat | `bookingDetailRepeatReservation` | Opakovat |
| — | Zobrazit rezervaci | `tripsViewBooking` | Zobrazit rezervaci |

---

## Co app tým sjednotí (checklist)

### ContentCard

1. **`ContentCard`** — dvouzónová karta (tělo + optional footer).
2. **`Card.variant`** — minimálně `default` a `inset` se stejným významem.
3. **`ContentCardActions`** — split CTA + vertikální divider + `Button ghost`.
4. **`ContentCardActionBar`** — stejný šedý bar, sticky / mimo kartu.
5. **`text-destructive`** — Zrušit / zrušený stav (nahradit ad-hoc `text-red-*`).
6. Feature obálky OK — building blocks musí nést názvy výše.

### Channel CTA

7. **`ChannelCtaId`** — stejná ID kanálů jako web (`whatsapp`, `telegram`, …).
8. **`channelCtaClass` / `channelIconButtonClass` / `channelIconTintClass`** — helpery místo inline hex ve feature kódu.
9. Nepoužívat `WhatsAppGreenButton` ani vlastní `#25D366` v obrazovkách.

### Button `choice` (časový chip)

10. **`Button` / `AppButton` `variant="choice"`** — časový chip termínu. Nepoužívat `NearestSlotPill`, `TimeChip`, …
11. Feature obálky (web názvy OK) — uvnitř jen `choice` chipy.

---

## Button `choice` — časový chip (nejbližší termíny)

**Primitivum (web = app):** `Button` → **`variant="choice"`**  
V app: **`AppButton variant="choice"`** (stejný význam, stejný název varianty).

To je ten **časový chip** (HH:MM / „Dnes v 16:30“).  
**Nepoužívat** paralelní názvy: `NearestSlotPill`, `TimeChip`, `SlotChip`, …

App wrapper dnes: **`SlotTimePill`** — tenká obálka nad `AppButton choice` + layout konstanty (`NEXT_SLOT_BUTTON_*`). Název `SlotTimePill` je app implementace; design kontrakt = **`choice`**.

### Feature obálky (web → app)

| Kde | Web (feature) | App (feature) — kde dnes | Chip uvnitř |
| --- | --- | --- | --- |
| Detail holiče | **`TeamProfileTodaySlots`** | `BarberTodaySlotsSection` | `SlotTimePill` → **`AppButton choice`** |
| Karta týmu / home | **`TeamMemberCardAvailability`** | `HomeTodayTeamSection` | `SlotTimePill` (`compact`) → **`AppButton choice`** |
| Booking → výběr holiče | **`EmployeeNearestSlotChoices`** | `ReservationEmployeeStep` | **gap:** dnes custom `View` pill, ne `choice` |

### Související app soubory

| Soubor | Role |
| --- | --- |
| `components/SlotTimePill.tsx` | Globální chip pro klik na termín → booking handoff |
| `components/booking/BookingHandoffServiceTimeButton.tsx` | Handoff řádek služby — `AppButton choice` + `NEXT_SLOT_BUTTON_*` |
| `constants/buttonVariants.ts` | Definice varianty **`choice`** |

### Web docs

- `docs/ui-buttons-for-app.md` — sekce **`choice`**
- `docs/booking-flow-ui-for-app.md` — sekce **Holič**

---

## Channel CTA — externí kanály (WhatsApp, Maps, …)

Externí komunikační / navigační kanály. **Feature kód nepoužívá hex** — jen `ChannelCtaId` + tokeny / helpery.

Web zdroj: `src/components/shared/channel-cta.ts` + tokeny v `src/app/globals.css`.

### Povinné názvy (web = app)

| ID (`ChannelCtaId`) | Token barva | Hover | Použití |
| --- | --- | --- | --- |
| `whatsapp` | `--brand-whatsapp` | `--brand-whatsapp-hover` | Operator sheet, profil holiče, share |
| `telegram` | `--brand-telegram` | `--brand-telegram-hover` | totéž |
| `sms` | `--brand-sms` | `--brand-sms-hover` | profil holiče (kulaté icon) |
| `maps` | `--brand-maps` | `--brand-maps-hover` | navigace Google Maps |
| `waze` | `--brand-waze` | `--brand-waze-hover` | navigace Waze (text černý) |

**Jen tint ikony** (ne plné CTA): `facebook` → `--brand-facebook`, `google` → `--brand-google`.

**Nepoužívat:** `WhatsAppGreenButton`, `TelegramBlueButton`, vlastní hex v feature souborech.

### Web API (referenční názvy helperů)

```ts
channelCtaClass("whatsapp")       // plné Button CTA
channelIconButtonClass("sms")     // kulaté icon buttony
channelIconTintClass.telegram     // barva ikony v řádku
```

CTA = typicky `Button` + `channelCtaClass(…)` (`block` / `pill` dle obrazovky).

**App cíl:** ekvivalent `utils/channelCta.ts` (nebo `constants/channelCta.ts`) se **stejnými názvy funkcí a ID**.

### Mapování — app (Expo) dnes

| `ChannelCtaId` | Kde v app | Dnes | Gap |
| --- | --- | --- | --- |
| `whatsapp` | `OperatorSupportSheet.tsx` | `AppButton` + `style={{ backgroundColor: '#25D366' }}` | ❌ inline hex → `channelCtaClass('whatsapp')` |
| `telegram` | `OperatorSupportSheet.tsx` | `AppButton` + `style={{ backgroundColor: '#229ED9' }}` | ❌ inline hex |
| `maps` | `BranchNavigateSheet.tsx` | `AppButton` + `#34A853` | ❌ inline hex (má být `--brand-maps`) |
| `waze` | `BranchNavigateSheet.tsx` | `AppButton` + `#33CCFF` | ❌ inline hex (má být `--brand-waze`) |
| `sms` | profil holiče (web) | zatím nemapováno v UI | — |
| `facebook` | share (web) | locale `barberShareFacebook`, UI TBD | icon tint only |
| `google` | share / OAuth (jiný kontext) | login `welcomeContinueGoogle` | icon tint only — ne plést s `maps` |

### Feature obálky (název může zůstat)

| Feature | App soubor | Channel building blocks uvnitř |
| --- | --- | --- |
| Operator contact sheet | `OperatorSupportSheet.tsx` | `channelCtaClass('whatsapp' \| 'telegram')` |
| Branch navigate sheet | `BranchNavigateSheet.tsx` | `channelCtaClass('maps' \| 'waze')` |
| Barber profile contact (web) | — | `channelIconButtonClass('sms')` + tint řádky |
| Share barber (web) | — | `channelIconTintClass` pro facebook / telegram / whatsapp |

### i18n kanálů (app)

| Kanál | App klíč |
| --- | --- |
| WhatsApp | `communicationChannel_whatsApp`, `operatorContactWhatsApp` |
| Telegram | `communicationChannel_telegram`, `operatorContactTelegram` |
| SMS | `communicationChannel_sms` |
| Google Maps | `kudyOpenGoogleMaps` |
| Waze | `kudyOpenWaze` |

---

## Web reference

| Co | Kde |
| --- | --- |
| `ContentCard` | `src/components/shared/content-card.tsx` |
| `Card` + varianty | `src/components/ui/card.tsx` |
| **Channel CTA** | `src/components/shared/channel-cta.ts` |
| Tlačítka | `docs/ui-buttons-for-app.md` (`choice`, `ghost`, …) |
| Booking flow UI | `docs/booking-flow-ui-for-app.md` (sekce Holič) |
| Tokeny | `src/app/globals.css` (`--background`, `--card`, `--brand-whatsapp`, …) |

---

## Historie

| Datum | Změna |
| --- | --- |
| 2026-06-16 | První verze — `ContentCard` + rezervace |
| 2026-06-16 | `ContentCardActionBar`, `text-destructive`, sticky detail |
| 2026-06-16 | Plná web spec: vrstvy, varianty, kontrakt, review, i18n `Auth.*`, gaps |
| 2026-06-16 | **Channel CTA** — `ChannelCtaId`, helpery, mapování Operator + Navigate sheet |
| 2026-06-16 | **`Button choice`** — časový chip; feature `TeamProfileTodaySlots` / `TeamMemberCardAvailability` / `EmployeeNearestSlotChoices` |
