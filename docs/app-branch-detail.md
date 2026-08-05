# Detail pobočky — mobilní app (handoff / implementace)

**Web spec (zdroj pravdy):** `seo-starter-2/docs/app-branch-detail.md`  
**Referenční web:** `BranchPageView.tsx` + související komponenty v `src/components/branches/`  
**Šablona v appce:** profil holiče (`app/screens/barber-detail.tsx`) — stejná identity + sticky pattern, jiný obsah pod sloty.

**Route v appce:** `/screens/branch-detail?id={crmBranchId}`  
**Orchestrátor:** `app/screens/branch-detail.tsx` · hook `app/hooks/useBranchDetailScreen.ts`

---

## Cíl

Jedna scrollovací kolona se **stejným obsahem a pořadím** jako web (mobil). Maximum reuse z:

- **Nejbližší pobočka** — kontakt, mapa, Otevřít / Navigovat / Zavolat, slot chipy  
- **Profil holiče** — identity, favorite, ⋮, sticky lišta, recenze, Rezervovat  
- **Pobočky (Kontakty)** — travel řádky, interiér carousel, statická copy  

---

## Pořadí bloků — checklist (mobil)

```
[Sticky: ← | Název pobočky | 📞 | Rezervovat]     ← po scrollu (sentinel u slotů)

Identity (avatar + název + ● status + ★ + ♥ + ⋮)
Kontakt (adresa + copy, otevřeno, mapa, Otevřít / Navigovat / Zavolat)
Nejbližší termíny (chipy, pokud data)
[Rezervovat] [SMS] [WA] [TG]
Další pobočky
────────────────────────
O salonu
Tým
Kudy k nám?
Jak se k nám dostanete?     ← video (16:9)
Interiér                    ← carousel (16:9, auto-rotate)
Virtuální prohlídka         ← pokud data
Parkovací mapa              ← pokud data
O manažerovi                ← vždy poslední v obsahu
────────────────────────
Recenze
```

Volitelné bloky (video / interiér / VR / parking) se **nezobrazí**, pokud pro pobočku nejsou data.

---

## Mapování web → app

| # | Blok (UX) | Web komponenta | App — dnes | App — cíl / akce |
|---|---|---|---|---|
| A | Sticky lišta | `BranchProfileMobileSticky` | ❌ fixed footer jen „Rezervovat na {pobočka}“ | **`BranchStickyBar`** — vzor `BarberStickyBar`: ← · název · 📞 · **Rezervovat** (krátký label `commonReserve`). Sentinel u slotů. |
| B | Identity | `BranchProfileIdentityHeader` | ⚠️ hero carousel + `BranchHeaderInfo` (starý layout) | **`BranchIdentitySection`** — vzor `BarberIdentitySection`: avatar = 1. fotka interiéru (fallback logo), název + **`LiveIndicator`** / open dot, `RatingBadge` → scroll na recenze, `Favorite` `entityType=branch`, `ProfileActionsMenu` `mode=branch`. |
| C | Kontakt + mapa | `BranchContactSection` | ⚠️ `BranchHeaderInfo` pill tlačítka + `BranchAddressRow` | **`BranchContactSection`** — extrahovat z `HomeNearestBranch` / `branches.tsx`: adresa + copy, `BranchOpenStatusRow`, `MapView` tile, `AppButton` Otevřít / Navigovat / Zavolat (`BranchNavigateSheet`, `OperatorSupportSheet`). |
| D | Nejbližší termíny | `BranchHomeSlotsSection` | ❌ | **`BranchHomeSlotsSection`** — reuse `SlotTimePill` + grouping z `HomeNearestBranch` (`groupNearestSlots`, `buildNearestBranchSlotsByInternalId`). Tap → `startBarberSlotHandoffBooking`. |
| E | Rezervovat + chat | `TeamMemberProfileContactActions` `mode=branch` | ⚠️ jen spodní `ReserveButton` + chybí SMS/WA/TG | **`BranchContactActions`** — plné Rezervovat (`buildBranchBookingHref`) + kanály s `branchAvailabilityMessage` + název pobočky (web `TeamMemberProfileContactActions`). |
| F | Další pobočky | `BranchOtherBranches` | ❌ | **`BranchOtherBranches`** — logo + název + adresa → `/screens/branch-detail?id=…` (ostatní ze `BRANCH_ORDER` / CRM). |
| G | O salonu | `BranchExpandableAbout` | ⚠️ `BranchDescriptionPreview` (+ modal) | **`BranchAboutSection`** — H2 + celý text (bez collapse), stejná copy jako web CMS. |
| H | Tým | `BranchTeamSection` | ✅ `BranchTeamSection` | Upravit pořadí; avatary 64–80 px už ~`Avatar size="lg"`. |
| I | Kudy k nám? | `BranchDirections` | ⚠️ link v `BranchLinksSection` → jiný screen | **`BranchDirectionsSection`** — inline text z `KUDY_K_NAM_VIDEOS` (`descriptionCs` / lokalizace), ne jen odkaz na `kudy-k-nam-detail`. |
| J | Video cesty | `DirectionsVideo` | ⚠️ `kudy-k-nam-detail.tsx` | **`BranchDirectionsVideoSection`** — H2 + `Video` / WebView, 16:9, zaoblené; data z `KUDY_K_NAM_VIDEOS.source`. |
| K | Interiér | `BranchInteriorGallery` | ⚠️ hero `ImageCarousel` nahoře (špatné místo) | **`BranchInteriorSection`** — `getBranchInteriorCarouselImages`, auto-rotate, tečky pod, 16:9. |
| L | VR prohlídka | `VirtualTourSection` | ⚠️ řádek v `BranchLinksSection` | **`BranchVirtualTourSection`** — H2 + embed (`getVrTourUrl`), 16:9. |
| M | Parkování | `ParkingMap` | ❌ | **`BranchParkingSection`** — Vimeo nebo klikací mapa (data doplnit dle web CMS / `BranchPageData`). |
| N | Manažer | `ManagerBlock` | ❌ | **`BranchManagerSection`** — vždy poslední před recenzemi; copy z API / statická data. |
| O | Recenze | `EmployeeReviewsSection` `entityType=branch` | ✅ `BranchReviewsSection` | Zachovat; přesunout **pod** obsahovou kartu; scroll target pro rating badge. |

Legenda: ✅ hotovo · ⚠️ existuje, špatné místo / layout · ❌ chybí

---

## Co je v appce dnes (legacy layout)

Současný `branch-detail.tsx`:

1. Full-width hero carousel nahoře (interiér — **má být až v sekci Interiér**)
2. Transparentní `Header` s favorite + ⋮ vpravo nahoře
3. Breadcrumbs → `BranchHeaderInfo` → `BranchAddressRow` → About preview
4. Tým → Recenze → `BranchLinksSection` (VR / web / kudy link)
5. Fixed footer: `ReserveButton` s `branchReserve` (dlouhý copy)

**Odchylky od webu / spec:**

| Téma | Dnes | Cíl |
|---|---|---|
| Šablona | Hero + starý header | Jako `barber-detail` (identity nahoře, bez hero carousel) |
| Sticky | Jen footer Rezervovat | Sticky top bar po scrollu (název + tel + Rezervovat) |
| Status u názvu | Text v `BranchOpenStatusRow` jinde | Barevná tečka u názvu (open / soon / closed) |
| Quick actions | Pills v headeru | Otevřít / Navigovat / Zavolat pod mapou (nearest pattern) |
| Sloty | Chybí | Sekce Nejbližší termíny |
| Chat CTA | Chybí | SMS / WA / TG s branch message |
| Další pobočky | Chybí | Seznam 3 ostatních poboček |
| Pořadí sekcí | About → Tým → Recenze → Links | Spec checklist výše |
| Recenze | Uprostřed | Na konci, mimo „obsahovou kartu“ |

---

## Klíčové UX pravidla (parity s webem)

| Téma | Pravidlo |
|---|---|
| Šablona | 1:1 s profilem holiče (`barber-detail.tsx`). |
| Status u názvu | Barevná tečka (`LiveIndicator` / branch open helper), ne text v titulku. |
| Sticky CTA | Jen **Rezervovat** (`commonReserve`) — **bez** „na {pobočka}“. |
| Primární CTA pod sloty | Také krátké Rezervovat. |
| Chat CTA | Předvyplněná zpráva o dostupnosti **pobočky** (`branchAvailabilityMessage` + název). |
| Média | Video, interiér, VR, parking = **16:9**, zaoblené (`rounded-2xl`). |
| Recenze | Stejný UI jako holič; `entityType=branch`, CRM branch id. |
| Favorite | `entityType=branch` + CRM id (už funguje v headeru — přesunout do identity). |
| Otevřít | V nearest = detail pobočky; na detailu = otevřít v nativních mapách (`openBranchMapsApp`). |

---

## Reuse — existující soubory

| Potřeba | Kde v appce |
|---|---|
| Nearest drawer (kontakt, mapa, tlačítka, sloty) | `components/home/HomeNearestBranch.tsx` |
| Pobočky screen (travel, interiér, tlačítka) | `app/(tabs)/(home)/branches.tsx` |
| Identity + sticky (holič) | `BarberIdentitySection`, `BarberStickyBar`, `barber-detail.tsx` |
| Open status | `BranchOpenStatusRow`, `utils/branchOpenStatus.ts` |
| Interiér fotky | `constants/branchInteriorGallery.ts` |
| Kudy / video / popis dopravy | `constants/kudy-k-nam-videos.ts`, `app/screens/kudy-k-nam-detail.tsx` |
| VR URL | `utils/branchDetailHelpers.ts` → `getVrTourUrl` |
| Adresa, souřadnice | `constants/branchContacts.ts`, `resolveCrmBranchId` |
| Navigace sheet | `BranchNavigateSheet` |
| Zavolat sheet | `OperatorSupportSheet` variant `callUs` |
| Slot handoff | `utils/reservationSlotHandoff.ts`, `SlotTimePill` |
| Booking URL | `utils/branchShareHelpers.ts` → `buildBranchBookingHref` |
| Recenze | `BranchReviewsSection`, `useBranchDetailScreen` |
| Tým | `BranchTeamSection` |
| Share / ⋮ menu | `ProfileActionsMenu` mode `branch` |
| Breadcrumbs | `SiteBreadcrumbs`, `branchBreadcrumbItems` |

---

## Data (orientačně)

| Potřeba | Zdroj |
|---|---|
| Branch CRM (název, adresa, popis, tým) | `getBranchById` — `api/branches.ts` |
| Copy About / Manažer / Kudy | CMS / statika (`KUDY_K_NAM_VIDEOS`, později API) |
| Adresa, mapa, otevírací | `branchContacts` + `branchOpenStatus` |
| Sloty | Home roster API → `buildNearestBranchSlotsByInternalId` (stejně jako nearest) |
| Recenze + rating | `getEntityReviews` `entityType=branch` |
| Booking | `/screens/reservation-create?recipe=branch-first&branchId=…` |
| Interior / VR | `branchInteriorGallery.ts`, `getVrTourUrl` |
| Parking | **TODO** — doplnit dle web `BranchPageData` / CMS |

---

## Implementační pořadí (doporučené)

1. **Refactor shell** — přepsat `branch-detail.tsx` na layout jako `barber-detail` (bez hero carousel, `ThemedScroller`, breadcrumbs, identity nahoře).  
2. **BranchIdentitySection** + **BranchStickyBar** (sentinel + scroll handler z barber-detail).  
3. **BranchContactSection** — extrakce z nearest/branches (mapa + 3 tlačítka).  
4. **BranchHomeSlotsSection** + slot data wiring.  
5. **BranchContactActions** — Rezervovat + SMS/WA/TG.  
6. **BranchOtherBranches**.  
7. Obsahové sekce G–N v pořadí (About, Tým, Kudy, video, interiér, VR, parking, manažer).  
8. Přesun **BranchReviewsSection** na konec; odstranit legacy `BranchHeaderInfo`, hero carousel, fixed footer s dlouhým copy.  
9. QA parity s webem + TestFlight.

---

## Soubory k úpravě / vytvoření

| Soubor | Akce |
|---|---|
| `app/screens/branch-detail.tsx` | Přepsat orchestraci dle checklistu |
| `app/hooks/useBranchDetailScreen.ts` | Případně sloty, manager copy, parking |
| `components/branch/BranchIdentitySection.tsx` | **Nový** |
| `components/branch/BranchStickyBar.tsx` | **Nový** (fork `BarberStickyBar`) |
| `components/branch/BranchContactSection.tsx` | **Nový** |
| `components/branch/BranchHomeSlotsSection.tsx` | **Nový** |
| `components/branch/BranchContactActions.tsx` | **Nový** |
| `components/branch/BranchOtherBranches.tsx` | **Nový** |
| `components/branch/BranchAboutSection.tsx` | **Nový** (nahradí preview/modal pattern) |
| `components/branch/BranchDirectionsSection.tsx` | **Nový** |
| `components/branch/BranchDirectionsVideoSection.tsx` | **Nový** |
| `components/branch/BranchInteriorSection.tsx` | **Nový** |
| `components/branch/BranchVirtualTourSection.tsx` | **Nový** |
| `components/branch/BranchParkingSection.tsx` | **Nový** |
| `components/branch/BranchManagerSection.tsx` | **Nový** |
| `components/branch/BranchHeaderInfo.tsx` | **Odstranit** po migraci |
| `components/branch/BranchLinksSection.tsx` | **Odstranit** / rozložit do sekcí |
| `locales/*.ts` | `branchAvailabilityMessage`, nadpisy sekcí, sticky copy |

---

## Ověření

- [ ] Pořadí bloků = checklist výše  
- [ ] Sticky lišta po scrollu k termínům; CTA jen „Rezervovat“  
- [ ] Tečka open status u názvu  
- [ ] Otevřít / Navigovat / Zavolat = stejné sheety jako nearest  
- [ ] Slot tap → booking handoff  
- [ ] SMS/WA/TG s branch message  
- [ ] Další pobočky → jiný detail  
- [ ] Volitelné sekce skryté bez dat  
- [ ] Recenze na konci; rating badge scrolluje dolů  
- [ ] Favorite + ⋮ v identity, ne v transparent headeru  

---

## Související docs

- Web spec: `seo-starter-2/docs/app-branch-detail.md`  
- Nearest branch: `seo-starter-2/docs/app-nearest-branch.md`  
- UI naming: `docs/ui-naming-bridge.md`  
- Deep links: `docs/app-deep-links.md`
