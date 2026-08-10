# Mapa poboček — specifikace pro web (parita s mobilní app)

Route obrazovky: **`/screens/map`** (`app/screens/map.tsx`).

Jde o fullscreen mapu s **horním headerem**, **spodním seznamem poboček** (bottom sheet) a **overlay drawerem pobočky** po kliknutí na pin.

---

## 1. Odkud se na mapu odkazuje

| Místo | UI prvek | Ikona | Text (CS) | Cílová URL |
|---|---|---|---|---|
| **Globální Search modal** (první položka) | Celý řádek v modalu | Obrázek `search-modal-branches.png` (32×32) + `ChevronRight` | „Pobočky“ / „Prohlédnout pobočky“ | `/screens/map` |
| **Služby** — sekce Základní, Balíčky, Barvení, Služby domů | `Section` link vpravo od nadpisu | Pouze `ChevronRight` (20px) — **`linkText` se nevykresluje** | Nadpis sekce + chevron | `/screens/map` |
| **Produkty** — sekce Katalog + Dárky | Stejně jako služby | `ChevronRight` | — | `/screens/map` |
| **Booking engine** — krok výběru pobočky | `Button` outline, small, rounded-full | **bez ikony** | „Zobrazit mapu“ | `/screens/map` |
| **Rezervace (create flow)** — krok pobočky | `Button` outline, small, rounded-full, centrovaný | **bez ikony** | „Zobrazit mapu“ | `/screens/map` |
| **Detail rezervace** — sekce Lokace | `Button` secondary, small, rounded-full | **`Map`** (Lucide) vlevo | „Celá mapa“ | `/screens/map` |
| **Detail produktu** — řádek skladu | Celý řádek skladu (pressable) | — | „Zobrazit na mapě“ (podtržený hint vpravo) | `/screens/map?mapQuery=…&mapLabel=…[&mapCentralWarehouse=1]` |

**Home „Nejbližší pobočka“** nevede na `/screens/map` — otevírá stejný **`BranchQuickSheet`**, ale z homepage (`HomeNearestBranch`).

---

## 2. Header mapové obrazovky

```
[ ← zpět ]     [ SearchBar — „Hledat“ ]     [ SlidersHorizontal ]
```

| Prvek | Chování |
|---|---|
| **Zpět** | Standardní `Header` back |
| **SearchBar uprostřed** | Tap → fullscreen search modal. Na mapě je **stejný** search bar jako jinde — **nefiltruje mapu**, jen naviguje |
| **SlidersHorizontal** (22px, touch 28×28) | Link na **`/screens/filters`** |

### Search modal (společný komponent)

- Placeholder: **„Hledat“** (`searchPlaceholder`)
- Blur overlay, animace shora
- Zavírací tlačítko: **`X`** (24px) v kruhu vpravo nahoře
- První položka **„Pobočky“** → `/screens/map`
- Ikona položky: `@/assets/img/search-modal-branches.png` (zobrazuje se 32×32 v boxu 48×48)

---

## 3. Vzhled samotné mapy

### Map provider

- **`react-native-maps`** (`MapView`) — na iOS typicky Apple Maps, na Androidu Google Maps.
- Web ekvivalent: Google Maps / Mapbox s podobným chováním.

### Počáteční viewport

```javascript
latitude:  50.0755 - 0.055  // ≈ 50.0205
longitude: 14.4378 - 0.015  // ≈ 14.4228
latitudeDelta:  0.28
longitudeDelta: 0.28
```

→ Široký pohled na Prahu a okolí (všechny 4 pobočky viditelné).

### Pozadí

- `bg-light-primary` / `dark:bg-dark-primary`

---

## 4. Markery poboček na mapě

Komponenta: **`PriceMarker`** (pro pobočky se používá režim **logo**, ne cena).

### Vzhled markeru (všechny 4 pobočky)

| Vlastnost | Hodnota |
|---|---|
| Velikost | **40×40 px** |
| Tvar | `rounded-xl` (12px radius) |
| Obsah | **Lokální PNG logo** pobočky, `contentFit: contain`, bílé pozadí |
| Anchor | střed markeru (0.5, 0.5) |
| Vybraný stav | **bílý border 2px** (`border-2 border-white`) |

### Assety markerů (lokální, bundled)

| Název pobočky (API) | Soubor |
|---|---|
| Kačerov | `assets/img/markers/kacerovbarbershop.png` |
| Hagibor | `assets/img/markers/hagiborbarrandov.png` |
| Modřany | `assets/img/markers/modranybarbershop.png` |
| Barrandov | `assets/img/markers/barrandovbarbershop.png` |

Mapování: `constants/branch-marker-images.ts` → klíč = **`branch.name`** z API (přesně „Kačerov“, „Hagibor“…).

### Souřadnice markerů (priorita)

1. **`branch.latitude` / `branch.longitude`** z API (pokud existují)
2. Fallback hardcoded podle názvu (`BRANCH_COORDINATES` v `map.tsx`)
3. Poslední fallback: offset od centra Prahy podle indexu v seznamu

Hardcoded souřadnice (shodné s `branchContacts.ts`):

| Pobočka | lat | lng |
|---|---|---|
| Kačerov | 50.04219531986807 | 14.459689653073983 |
| Hagibor | 50.07850819920388 | 14.48365959725635 |
| Modřany | 50.00477408096832 | 14.416534741433177 |
| Barrandov | 50.030533187365194 | 14.361240910745531 |

### CRM UUID ↔ interní ID

```
barrandov → 3d17de69-36f0-4ff9-b944-6aad97e4d5f6
hagibor   → 8adcfbc6-05d2-4330-80e7-785f02ad6753
kacerov   → 57c45c57-1b27-4227-8e76-ec140d035c38
modrany   → d15ee0b6-2e66-4edf-a4d1-5f87a89535a3
```

Zdroj: `constants/crmBranchIds.ts`.

---

## 5. Klik na marker (logo pobočky)

```
Tap marker
  ├─ CRM UUID → known internal ID?
  │    ├─ ANO → otevře BranchQuickSheet (drawer)
  │    │         + nastaví selectedMarkerId (bílý border)
  │    │         + na pozadí fetch travel info (GPS + API)
  │    └─ NE  → fallback: navigace na /branch-detail?id={crmUuid}
  └─ (native title z MapView zůstává branch.title)
```

**Důležité:** Klik na pin **neotevírá** přímo detail pobočky (pokud je pobočka v mapování). Otevře **quick sheet**.

---

## 6. Spodní seznam poboček (bottom sheet)

Automaticky se **otevře při načtení obrazovky** (`actionSheetRef.show()`).

| Vlastnost | Hodnota |
|---|---|
| Typ | Non-modal bottom sheet (`isModal: false`) |
| Snap body | **10%** a **100%** výšky obrazovky |
| Výchozí snap | **10%** (jen handle + počet) |
| Gestures | Ano — tahem nahoru/dolů |
| Zavření | **`closable: false`** — nelze úplně skrýt |
| Interakce s mapou | **`backgroundInteractionEnabled: true`** — mapu lze ovládat i při otevřeném sheetu |
| Pozadí | `borderTopRadius: 20`, barva `colors.bg` (theme) |

### Header sheetu

- Handle: šedý pill **56×8 px**, `rounded-full`, `mt-2`
- Text: **`{počet} Branches`** — **hardcoded anglicky**, lokalizace chybí
  - Loading: zobrazí se `…` místo počtu

### Položka seznamu (`CustomCard` + `FlatList`)

Každá pobočka = karta s odkazem na **`/branch-detail?id={crmUuid}`**:

```
┌─────────────────────────────────┐
│  ImageCarousel (height 300px)   │  ← fotky pobočky, rounded-xl
├─────────────────────────────────┤
│  Název pobočky (bold, base)     │  ★ 4.5
│  Adresa nebo název (sm, muted)  │
└─────────────────────────────────┘
```

| Pole | Zdroj |
|---|---|
| **Obrázky** | `branch.media` (seřazené) → `branch.imageUrl` → první služba s obrázkem → fallback Unsplash barbershop URL |
| **Název** | `branch.name` |
| **Popis** | `branch.address` nebo fallback `branch.name` |
| **Rating** | **Hardcoded `4.5`** — API `averageRating` se **nepoužívá** |
| **Rating UI** | `ShowRating` size `md`: číslo `4.5` + Ionicons `star` 16px |

**Klik na kartu v seznamu** → **detail pobočky** (ne quick sheet).

→ Jiné chování než klik na pin na mapě.

### Loading / prázdný stav

- Spinner `large` + text **„Načítání poboček…“** (`mapLoadingBranches`)
- Při prázdném filtrovaném seznamu (bez loading): prázdný list (bez dedikované empty message)

---

## 7. Filtry poboček

Tlačítko **SlidersHorizontal** → `/screens/filters`.

Filtry se ukládají do **`BranchFilterContext`** (globální stav v app).

**Při opuštění mapové obrazovky se filtry resetují** na default (`resetFilter()` v cleanup `useEffect`).

### Filtrační data

- **Nejsou z API** — lokální `BRANCH_FILTER_DATA` keyed by `branch.name`
- 4 pobočky: Modřany, Kačerov, Hagibor, Barrandov
- Kritéria: min. plocha (m²), min. křesla, min. umyvadla, amenities (chipy), options (chipy)
- Pobočka bez záznamu v `BRANCH_FILTER_DATA` → **projde filtrem vždy**

Zdroj: `constants/branch-filter-data.ts`.

### UI filtrů (pro referenci)

- Slider plochy 20–85 m², krok 5, track `#FF2358`
- Chipy s ikonami: Wallet, Coffee, CreditCard, Train, TrainFront, Bus, Snowflake, Wifi, Car, Accessibility, Wind, Armchair…
- Footer tlačítko: **„Použít filtry“** → `router.back()` + uloží stav

Filtrovaný seznam ovlivňuje **markery i bottom sheet list** současně.

---

## 8. Query parametry mapy (deep link)

| Param | Účel |
|---|---|
| `mapQuery` | Adresa/string pro geocoding (expo-location / nativní geocoder) |
| `mapLabel` | Titulek extra markeru (fallback = mapQuery) |
| `mapCentralWarehouse` | `1` nebo `true` → speciální callout centrálního skladu |

### Chování s `mapQuery`

1. Geocode `mapQuery` (na Androidu nejdřív permission GPS)
2. Animace mapy na region (delta 0.05, duration 500 ms)
3. Přidá **extra marker** v barvě `colors.highlight` (brand accent)

### Centrální sklad (`mapCentralWarehouse=1`)

Callout po tapu na pin:

- **Nadpis:** `mapLabel` (tučný, base)
- **Text (CS):** „Zobrazená adresa odpovídá centrálnímu skladu, nikoli kamenné prodejně. Nákup i osobní vyzvednutí zboží je na tomto místě možné výhradně po předchozí telefonické domluvě. Pro koordinaci nás prosím kontaktujte na“
- **Telefon:** `+420 774 522 114` — podtržený, barva highlight, `tel:+420774522114`
- A11y label telefonu: „Zavolat pro domluvu nákupu nebo vyzvednutí na centrálním skladě“

Bez `mapCentralWarehouse` → jen standardní pin s `title={mapLabel}`.

Příklad URL z detailu produktu:

```
/screens/map?mapQuery={encoded}&mapLabel={encoded}&mapCentralWarehouse=1
```

---

## 9. BranchQuickSheet — drawer po kliknutí na pin

Fullscreen-height sheet (`snapPoints: [100]`), sdílený s homepage „Nejbližší pobočka“.

Zdroj: `components/branch/BranchQuickSheet.tsx`.

### Horní část

| Prvek | Detail |
|---|---|
| **Název pobočky** | `branchMeta.shortLabel` (Kačerov, Hagibor…) — tap → detail pobočky |
| **Adresa** | `BranchAddress` — muted text + Copy ikona 12px, tap = kopírování + toast „Zkopírováno!“ |
| **Stav otevření** | Chip s barevnou tečkou (zelená/oranžová/červená) + link „Zobrazit otevírací dobu“ |
| **Favorite** | Srdce, entityType `branch` |
| **Menu (⋮)** | Sdílet / Hodnotit / Rezervovat |

### Media řádek (aspect 16:10)

- **Vlevo:** mini `MapView` (statická, tap → otevře Google Maps app)
- **Vpravo** (pokud existují interiéry): carousel fotek z S3

Interiéry (`constants/branchInteriorGallery.ts`):

| Pobočka | URL (S3) |
|---|---|
| Kačerov | `https://s3.xrb.cz/site/2024/07/Kacerov-1.webp`, … (4 fotky) |
| Modřany | `https://s3.xrb.cz/site/2024/07/modrany-1.webp`, … (4 fotky) |
| Hagibor | `https://s3.xrb.cz/site/2024/12/IMAGE-2024-12-21-141941.webp`, … (3 fotky) |
| Barrandov | `https://s3.xrb.cz/site/2025/11/IMAGE-2025-11-19-160514-1024x682.webp` |

Fallback: lokální marker PNG z `branchContacts.ts`.

### Akční tlačítka (řada 3× outline, sm, rounded-full)

| Tlačítko | Ikona | Text CS |
|---|---|---|
| Otevřít | `ExternalLink` 14px | „Otevřít“ |
| Navigovat | `Navigation` 14px | „Navigovat“ |
| Zavolat | `Phone` 14px | „Zavolat“ |

### Travel rows (po načtení GPS + API)

Tap na řádek → otevře **BranchNavigateSheet**

| Ikona | Text (šablony) |
|---|---|
| `MapPin` | „Od vás {distance}“ |
| `Car` | „{minutes} min autem“ + volitelně „ · dle aktuálního provozu“ |
| `Bike` | „{minutes} min na kole“ |
| `Footprints` | „{minutes} min pěšky“ |

### Nejbližší termíny

- Nadpis: **„Nejbližší volné termíny“**
- Loading: malý spinner
- Prázdné: **„Momentálně nemáme volné termíny na této pobočce.“**
- Skupiny po dnech → **`SlotTimePill`**: `{čas} · {jméno barbera}` → spustí handoff booking flow

---

## 10. BranchNavigateSheet (nested z quick sheetu)

Pořadí shora dolů:

1. Logo Real Barber (28×32) — light/dark varianta z `assets/img/wallet/realbarber-light.png` / `realbarber-dark.png`
2. **„Navigovat do pobočky {název}“**
3. **Google Maps** — ikona `MapPin` 20px, barva **`#34A853`**, fill stejná
4. **Waze** — ikona `Navigation` 20px, barva **`#33CCFF`**
5. **`BranchAddress`** — muted adresa + Copy (bez input boxu)

Po výběru Maps/Waze: sheet se zavře, po **300 ms** deep link:

- Google: `https://www.google.com/maps/search/?api=1&query={lat,lng}` nebo encoded adresa
- Waze: `https://waze.com/ul?ll=…&navigate=yes` nebo `?q=…`

Zdroj: `components/BranchNavigateSheet.tsx`.

---

## 11. Načítání dat — API a zdroje

### Seznam poboček na mapě

```
GET /api/client/branches?includeReviews=true&reviewsLimit=1
```

(nebo Client App V1: `GET /branches` pokud `CLIENT_APP_V1_ENABLED`)

- Auth: **`apiToken`** z `useAuth()`
- Bez tokenu: prázdný seznam, loading skončí
- Zdroj: `api/branches.ts` → `getBranches()`

Použité pole z `Branch`:

- `id`, `name`, `address`, `latitude`, `longitude`, `media`, `imageUrl`, `services[]`

### Nejbližší termíny (quick sheet z mapy)

Hook **`useBranchHomeSlotsCatalog`**:

```
GET /api/home?date={todayPrague}&locale={cs|en}
```

→ zpracování přes `buildNearestBranchSlotsByInternalId`

→ cache **60 s**

Zdroj: `hooks/useBranchHomeSlotsCatalog.ts`, `utils/fetchBranchHomeSlotsCatalog.ts`.

### Travel info (vzdálenost/čas)

Po otevření quick sheetu:

1. Okamžitě: `buildMinimalBranchTravel` (bez vzdáleností)
2. Async: GPS permission → `POST {WEB_BFF_ORIGIN}/api/branches/nearest/` s `{latitude, longitude}`
3. Najde branch podle `internalId` v odpovědi

Fallback při chybě: lokální výpočet (`computeNearestBranchesLocally`).

Zdroj: `utils/branchTravelHelpers.ts`, `lib/branches/postNearestBranches.ts`.

### Statická metadata poboček (adresa, souřadnice pro sheet)

`constants/branchContacts.ts` — **hardcoded** pro 4 pobočky (používá quick sheet, ne API adresu z pin click flow).

| internalId | shortLabel | adresa |
|---|---|---|
| kacerov | Kačerov | Budějovická 615/47, Praha 4 |
| hagibor | Hagibor | Počernická 3492/1a, Praha 10 |
| modrany | Modřany | Čs. exilu 40, Praha 12 |
| barrandov | Barrandov | O. Scheinpflugové 1293/4, Praha 5 |

---

## 12. Texty na obrazovce — kompletní přehled (CS)

| Klíč | Text |
|---|---|
| `searchPlaceholder` | Hledat |
| `searchBranches` | Pobočky |
| `searchBranchesSubtitle` | Prohlédnout pobočky |
| `mapLoadingBranches` | Načítání poboček… |
| Bottom sheet header | **`N Branches`** (EN, nelokalizováno) |
| `filtersTitle` | Filtry |
| `filtersApply` | Použít filtry |
| `reservationShowMap` | Zobrazit mapu |
| `bookingDetailFullMap` | Celá mapa |
| `commonViewAll` | Zobrazit vše *(předáváno do Section, ale nevykresluje se)* |
| `productWarehouseMapHint` | Zobrazit na mapě |
| `productWarehouseOpenMap` | Otevřít adresu skladu na mapě |
| `nearestBranchOpen` | Otevřít |
| `branchNavigateSectionTitle` | Navigovat |
| `barberPhoneCall` | Zavolat |
| `nearestBranchSlotsTitle` | Nejbližší volné termíny |
| `nearestBranchSlotsEmpty` | Momentálně nemáme volné termíny na této pobočce. |
| `branchNavigateSheetHeading` | Navigovat do pobočky |
| `kudyOpenGoogleMaps` | Otevřít v Google Maps |
| `kudyOpenWaze` | Otevřít ve Waze |
| `branchCopyAddress` | Zkopírovat adresu |
| `clipboardCopied` | Zkopírováno! |
| `mapCentralWarehouseCalloutBeforePhone` | *(viz sekce 8)* |
| `mapCentralWarehousePhoneDisplay` | +420 774 522 114 |
| `mapCentralWarehousePhoneA11y` | Zavolat pro domluvu nákupu nebo vyzvednutí na centrálním skladě |
| `nearestBranchHoursHint` | Zobrazit otevírací dobu |
| `nearestBranchHoursTooltipTitle` | Otevírací doba: |
| `nearestBranchHoursWeekdays` | Po–Pá: 09:00–21:00 |
| `nearestBranchHoursWeekend` | So–Ne: 10:00–18:00 |
| `branchMenuOpen` | Menu pobočky |

---

## 13. Diagram interakcí

```mermaid
flowchart TD
  Entry[Entry points] --> MapScreen[/screens/map]
  MapScreen --> LoadBranches[GET /api/client/branches]
  MapScreen --> BottomSheet[Bottom sheet list 10-100%]
  MapScreen --> Markers[PriceMarker logos]

  Markers -->|tap known branch| QuickSheet[BranchQuickSheet]
  Markers -->|tap unknown CRM id| BranchDetail[/branch-detail]
  BottomSheet -->|tap card| BranchDetail

  QuickSheet --> Slots[GET /api/home slots cache]
  QuickSheet --> Travel[POST /api/branches/nearest/]
  QuickSheet --> NavigateSheet[BranchNavigateSheet]
  QuickSheet --> CallSheet[OperatorSupportSheet callUs]

  MapScreen -->|mapQuery param| Geocode[Geocode + extra marker]
  HeaderFilter[SlidersHorizontal] --> Filters[/screens/filters]
  Filters -->|apply| MapScreen
```

---

## 14. Detaily důležité pro webovou paritu

1. **Dvě různé akce pro stejnou pobočku:** pin → quick sheet; karta v seznamu → detail.
2. **Rating 4.5 je fixní** na mapě — ne brát z API.
3. **Filtry se resetují** po odchodu z mapy (ne perzistentní mezi návštěvami mapy).
4. **Bottom sheet nelze zavřít** — vždy viditelný minimálně v 10% výšce.
5. **Search bar na mapě nefiltruje** — jen otevírá globální navigaci.
6. **Markery používají lokální PNG loga**, ne API `imageUrl`.
7. **Quick sheet metadata** (adresa, souřadnice pro mini mapu) z `branchContacts.ts`, ne vždy z API response pinu.
8. **Section „Zobrazit vše“** u služeb/produktů vede na mapu, ale UI ukazuje jen **chevron**, ne text.
9. **4 pobočky** — pokud API vrátí více/méně, markery bez PNG fallbacknou na price-style marker (v praxi všechny 4 mají PNG).
10. **Dark mode** — všechny barvy přes theme tokens (`light-*` / `dark-*`).

---

## 15. Assety — souhrn

| Asset | Cesta | Použití |
|---|---|---|
| Marker loga | `assets/img/markers/*.png` | Piny na mapě |
| Search modal | `assets/img/search-modal-branches.png` | Search modal položka |
| RB logo v navigate sheet | `assets/img/wallet/realbarber-light.png` / `realbarber-dark.png` | BranchNavigateSheet |
| Interiéry | `https://s3.xrb.cz/site/...` | Carousel v quick sheetu |
| Fallback foto v listu | `https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400` | Když pobočka nemá media |
| Home nearest tile | `assets/img/branches.png` | *(jen homepage, ne map screen)* |

---

## 16. Související soubory v repozitáři

| Soubor | Účel |
|---|---|
| `app/screens/map.tsx` | Hlavní obrazovka mapy |
| `components/PriceMarker.tsx` | Custom map marker |
| `components/branch/BranchQuickSheet.tsx` | Drawer po kliknutí na pin |
| `components/BranchNavigateSheet.tsx` | Google Maps / Waze + adresa |
| `components/shared/BranchAddress.tsx` | Adresa + Copy |
| `constants/branch-marker-images.ts` | Mapování názvu → PNG marker |
| `constants/branchContacts.ts` | Statická metadata poboček |
| `constants/branch-filter-data.ts` | Lokální filtrační atributy |
| `constants/crmBranchIds.ts` | CRM UUID ↔ internal ID |
| `constants/branchInteriorGallery.ts` | URL interiérových fotek |
| `contexts/BranchFilterContext.tsx` | Stav filtrů |
| `app/screens/filters.tsx` | Obrazovka filtrů |
| `hooks/useBranchHomeSlotsCatalog.ts` | Cache volných termínů |
| `utils/branchTravelHelpers.ts` | Travel info pro quick sheet |
| `api/branches.ts` | API klient pro pobočky |

---

*Dokument vychází ze stavu mobilní app k datu sestavení. Pro EN texty viz `locales/en.ts` (stejné klíče).*
