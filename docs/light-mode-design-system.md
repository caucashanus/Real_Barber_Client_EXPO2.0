# Light Mode – Design System & Implementation Guide

> **Source of truth:** mobilní aplikace Real Barber Client (Expo / React Native)  
> **Verze dokumentu:** vychází z aktuálního stavu repozitáře aplikace  
> **Scope:** pouze **Light Mode**. Dark Mode na webu už existuje — **neměnit**.

---

## Cíl

Tento dokument slouží jako podklad pro vývojáře webu.

V současné době máme v aplikaci implementovaný **Dark Mode i Light Mode**. Web již Dark Mode podporuje, takže jeho vzhled ani nastavení v rámci tohoto úkolu **neřešíme**.

Cílem je vytvořit na webu **Light Mode**, který bude vizuálně odpovídat Light Modu v aplikaci.

Vývojář by měl být schopný podle této dokumentace přesně pochopit:

- jaké barvy aplikace používá,
- jaké komponenty používáme,
- jaké barvy mají jednotlivé komponenty,
- jak fungují backgroundy, texty, border, inputy, buttony apod.,
- jaké jsou stavy jednotlivých komponent,
- jak se mají komponenty chovat v Light Modu,
- a jak celé nastavení přenést na web.

---

## 1. Design princip

Light Mode není samostatný nový design.

Jedná se o **stejný design systém jako v aplikaci**, pouze s Light Mode barevnou paletou.

Web by proto měl zachovat:

- stejnou vizuální hierarchii,
- stejné názvy a významy barevných tokenů,
- stejné typy komponent,
- stejné states,
- stejné border radius,
- stejné typografické principy,
- stejné spacing hodnoty,
- stejné chování komponent.

Rozdíl mezi aplikací a webem by měl být pouze v implementaci, nikoliv ve vizuálním jazyce.

**Hlavní pravidlo:** Pokud je hodnota v aplikaci definovaná, web ji **přebírá**. Nevytvářet vlastní alternativní Light Mode.

---

## 2. Color Tokens

Barvy implementujte jako **design tokens / CSS variables**, nikoliv natvrdo v komponentách.

### 2.1 Kanonické zdroje v aplikaci

| Soubor | Účel |
|---|---|
| `tailwind.config.js` | Tailwind tokeny `light.*`, `brand.*`, `highlight` |
| `contexts/ThemeColors.tsx` | Runtime hook `useThemeColors()` — light/dark přepínání |
| `constants/buttonTokens.ts` | Sémantické barvy tlačítek |
| `contexts/AccentColorContext.tsx` | Uživatelský accent (default `#FF4F31`) |

### 2.2 Doporučené CSS variables (Light Mode)

```css
:root,
[data-theme="light"] {
  /* Backgrounds */
  --background-primary: #ffffff;
  --background-secondary: #F1F1F1;
  --background-tertiary: #efefef;        /* chatBg — méně časté */
  --background-sheet: #ffffff;           /* bottom sheets */

  /* Text */
  --text-primary: #000000;
  --text-secondary: #64748B;             /* light.subtext */
  --text-tertiary: rgba(0, 0, 0, 0.4);  /* placeholder / muted */
  --text-on-accent: #FFFFFF;

  /* Borders */
  --border-primary: #E2E8F0;             /* ThemeColors.border */
  --border-secondary: #E5E5E5;           /* neutral-200 — inputy, karty */
  --border-subtle: rgba(0, 0, 0, 0.10);  /* card border black/10 */
  --border-strong: rgba(0, 0, 0, 0.35);  /* outline button */

  /* Brand */
  --brand-primary: #767676;
  --brand-primary-foreground: #FFFFFF;
  --brand-accent: #FF4F31;               /* highlight — fallback accent */
  --brand-secondary: #0F0F0F;
  --brand-secondary-foreground: #FFFFFF;
  --brand-destructive: #DC2626;
  --brand-border: #404040;

  /* Icons */
  --icon-primary: #000000;
  --icon-secondary: #64748B;
  --icon-muted: rgba(0, 0, 0, 0.4);
  --icon-on-accent: #FFFFFF;
  --icon-disabled: rgba(0, 0, 0, 0.4);

  /* Overlay / state */
  --overlay-state: rgba(0, 0, 0, 0.3);

  /* Semantic */
  --success: #16A34A;
  --success-muted: #4ADE80;
  --success-emphasis: #059669;
  --warning: #F59E0B;
  --warning-text: #B45309;
  --error: #EF4444;
  --error-strong: #DC2626;
  --info-text: #64748B;

  /* Accent selected states (choice chips, slot pickers) */
  --accent-selected-border: rgba(255, 79, 49, 0.70);
  --accent-selected-bg: rgba(255, 79, 49, 0.15);

  /* Spacing */
  --spacing-global: 24px;

  /* Radius */
  --radius-sm: 2px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-color: rgba(0, 0, 0, 0.15);
  --shadow-sm-offset: 0 1px 2.5px;
  --shadow-md-offset: 0 3px 5px;
  --shadow-lg-offset: 0 10px 10.84px;
}
```

### 2.3 Mapování app token → web CSS

| Aplikace (Tailwind / hook) | Light hodnota | Web CSS variable |
|---|---|---|
| `light.primary` / `colors.bg` | `#ffffff` | `--background-primary` |
| `light.secondary` / `colors.secondary` | `#F1F1F1` | `--background-secondary` |
| `light.text` / `colors.text` | `#000000` | `--text-primary` |
| `light.subtext` | `#64748B` | `--text-secondary` |
| `colors.placeholder` | `rgba(0,0,0,0.4)` | `--text-tertiary` |
| `colors.border` | `#E2E8F0` | `--border-primary` |
| `neutral-200` | `#E5E5E5` | `--border-secondary` |
| `highlight` / `colors.highlight` | `#FF4F31`* | `--brand-accent` |
| `brand.destructive` | `#DC2626` | `--brand-destructive` |

\* **Accent color:** Uživatel si může v aplikaci změnit accent (`AccentColorContext`, storage key `@app_accent_color`). Default je `#FF4F31`. Web by měl podporovat stejný mechanismus nebo alespoň stejný default.

### 2.4 Dark Mode (beze změny)

```css
[data-theme="dark"] {
  /* Existující web Dark Mode — neměnit v tomto tasku */
}
```

---

## 3. Backgrounds

V Light Modu rozlišujeme několik úrovní pozadí.

### Primary Background — `#ffffff`

**Token:** `--background-primary` · `bg-light-primary` · `colors.bg`

Použití:

- hlavní obsah obrazovek,
- root layout,
- bottom sheets,
- header (varianta `default`),
- ThemedScroller / ThemedFooter.

### Secondary Background — `#F1F1F1`

**Token:** `--background-secondary` · `bg-light-secondary` · `colors.secondary`

Použití:

- cards footer zóny,
- rating pills,
- icon contained variant,
- tab bar top border area,
- ContentCardActionBar,
- card footer (`border-t` sekce).

### Tertiary Background — `#efefef`

**Token:** `colors.chatBg`

Použití:

- chat/message plochy (specifické obrazovky).

### Panel / subtle fill — `rgba(0, 0, 0, 0.05)`

**Token:** `bg-black/5`

Použití:

- `AppButton variant="panel"`,
- jemné zvýraznění na světlém pozadí.

---

## 4. Text

Text musí mít jasně definovanou hierarchii.

### Primary Text — `#000000`

**Token:** `--text-primary` · `text-light-text` · `text-black`

Použití:

- nadpisy,
- hlavní informace,
- input text,
- button text (outline, ghost, choice, link),
- header title.

### Secondary Text — `#64748B`

**Token:** `--text-secondary` · `text-light-subtext`

Použití:

- popisky sekcí (Section subtitle),
- metadata,
- doplňující informace u cardů.

### Tertiary / Muted Text

| Hodnota | Použití |
|---|---|
| `rgba(0, 0, 0, 0.4)` | Placeholder, animated input label (unfocused) |
| `#737373` (`neutral-500`) | Neaktivní tab label |
| `#525252` (`neutral-600`) | Header subtitle |
| `#6B7280` (`gray-500`) | Card meta / description |

### Typografie — font family

Aplikace primárně používá **systémový font**. V Tailwind je připravena rodina **Outfit** (`font-outfit`, `font-outfit-bold`), ale globálně není vynucena — web může použít systémový stack nebo Outfit, pokud je na webu dostupný.

---

## 5. Borders

Bordery musí být v Light Modu viditelné, ale nemají působit příliš výrazně.

### Primary Border — `#E5E5E5` (`neutral-200`)

Použití:

- inputy (default state),
- cards (`border-neutral-200`),
- select/search fields,
- dividers mezi sekcemi card footer.

Alternativa pro obecné UI oddělení: `#E2E8F0` (`colors.border`).

### Secondary Border — jemnější

| Hodnota | Použití |
|---|---|
| `rgba(0, 0, 0, 0.10)` | CustomCard default border |
| `rgba(0, 0, 0, 0.15)` | Panel button border |
| `rgba(0, 0, 0, 0.20)` | Choice chip default |
| `rgba(0, 0, 0, 0.25)` | Outline on light-card surface |
| `rgba(0, 0, 0, 0.35)` | Outline button default |

### Focus border — `#A3A3A3` (`neutral-400`)

Použití: input focus state.

### Error border — `#EF4444` (`red-500`)

Použití: input error state.

---

## 6. Buttons

Globální button systém: **`AppButton`** (`components/AppButton.tsx`) + **`getAppButtonClasses()`** (`constants/buttonVariants.ts`).

**Varianty:** `default` | `outline` | `choice` | `panel` | `secondary` | `ghost` | `destructive` | `link`

**Velikosti:** `xs` | `sm` | `md` | `lg` | `icon` | `icon-sm`

**Disabled (všechny varianty):** `opacity: 0.5`

### 6.1 Primary / Default Button (`variant="default"`)

Hlavní CTA — rezervace, submit. Wrapper: `ReserveButton`.

| State | Light Mode |
|---|---|
| Default | Background: user accent (fallback `#FF4F31`), text `#FFFFFF`, `font-medium` |
| Active / pressed | `opacity: 0.9` |
| Disabled | `opacity: 0.5` |
| Focus | Doporučeno web focus ring v barvě accent |
| Radius | `rounded-md` (6px) |

### 6.2 Secondary Button (`variant="secondary"`)

| State | Light Mode |
|---|---|
| Default | Background `#0F0F0F`, border `#404040`, text `#FFFFFF` |
| Active | `opacity: 0.9` |
| Disabled | `opacity: 0.5` |
| Radius | `rounded-lg` (8px) |

### 6.3 Outline Button (`variant="outline"`)

Sekundární akce na hlavním pozadí.

| State | Light Mode |
|---|---|
| Default | Background transparent, border `rgba(0,0,0,0.35)`, text `#000000` |
| Active | Background `rgba(0,0,0,0.10)` |
| On light-card surface | Border `rgba(0,0,0,0.25)`, active bg `rgba(0,0,0,0.05)` |
| Radius | `rounded-lg` |

### 6.4 Ghost Button (`variant="ghost"`)

| State | Light Mode |
|---|---|
| Default | Transparent, text `rgba(0,0,0,0.8)` |
| Active | Background `rgba(0,0,0,0.05)`, text `#000000` |
| Radius | `rounded-lg` |

Použití: header back button, icon actions.

### 6.5 Choice Button (`variant="choice"`)

Slot picker, day picker, tier picker.

| State | Light Mode |
|---|---|
| Default | Background `#ffffff`, border `rgba(0,0,0,0.20)`, text `rgba(0,0,0,0.9)`, weight 500 |
| Selected | Border accent @ 70%, background accent @ 15%, text `#000000`, weight 600 |
| Active (default) | Background `rgba(0,0,0,0.10)` |
| Active (selected) | `bg-brand-accent/20` |
| Radius | `rounded-lg` |

### 6.6 Panel Button (`variant="panel"`)

| State | Light Mode |
|---|---|
| Default | Background `rgba(0,0,0,0.05)`, border `rgba(0,0,0,0.15)`, text `#000000` |
| Active | Background `rgba(0,0,0,0.05)` |
| Layout | Left-aligned, full width optional |

### 6.7 Destructive Button (`variant="destructive"`)

| State | Light Mode |
|---|---|
| Default | Background `#DC2626`, text `#FFFFFF`, `font-semibold` |
| Active | `opacity: 0.9` |

### 6.8 Link Button (`variant="link"`)

| State | Light Mode |
|---|---|
| Default | Transparent, text `#000000` |
| Active | `opacity: 0.8`, underline |

### 6.9 Button sizes (Light Mode)

| Size | Container | Text |
|---|---|---|
| `xs` | `height: 22px`, `px: 6px` | `12px` (text-xs) |
| `sm` | `min-height: 32px`, `px: 12px`, `py: 6px` | `14px` (text-sm) |
| `md` | `px: 16px`, `py: 12px` | `16px` (text-base) |
| `lg` | `px: 16px`, `py: 20px` | `16px` (text-base) |
| `icon` | `36×36px` | — |
| `icon-sm` | `32×32px` | — |

**Icon sizes inside buttons:** xs/icon-sm → 14px, sm → 16px, md/lg → 18px.

### 6.10 Legacy Button (`components/Button.tsx`)

Starší komponenta — preferujte `AppButton`. Pro referenci:

| Variant | Light Mode |
|---|---|
| `primary` | bg accent, text white |
| `secondary` | bg `#F1F1F1`, text black |
| `outline` | transparent, border black, text black |
| `ghost` | transparent, text black |

---

## 7. Inputs

Hlavní komponenta: **`Input`** (`components/forms/Input.tsx`).

Varianty: `animated` (default) | `classic` | `underlined`

Alternativa: **`TextInput`** (`components/forms/TextInput.tsx`) — starší pattern.

### 7.1 Společné Light Mode hodnoty

| Vlastnost | Hodnota |
|---|---|
| Height (single line) | `56px` (`h-14`) |
| Height (multiline) | `144px` (`h-36`) |
| Border radius | `12px` (`rounded-xl`) — animated/classic |
| Background | transparent |
| Text | `#000000` |
| Placeholder | `rgba(0,0,0,0.4)` |
| Padding horizontal | `12px` (`px-3`) |
| Padding vertical | `12px` (`py-3`) |
| Label cutout bg | `#ffffff` |

### 7.2 Stavy

| State | Border | Text | Poznámka |
|---|---|---|---|
| Default | `#E5E5E5` (`neutral-200`) | `#000000` | |
| Focus | `#A3A3A3` (`neutral-400`) | `#000000` | Animated label: 16px → 12px |
| Filled | `#E5E5E5` | `#000000` | Label nahoře (animated) |
| Disabled | Stejné + snížená interakce | Muted | Web: snížit opacity |
| Error | `#EF4444` (`red-500`) | Error message `text-xs text-red-500` | |
| Success | *Aplikace nemá dedikovaný success input state* | — | Nepřidávat, pokud není v app |

### 7.3 Animated label

| State | Font size | Color |
|---|---|---|
| Unfocused (empty) | 16px | `rgba(0,0,0,0.4)` |
| Focused / filled | 12px | `#000000` |

Transition duration: **200ms**.

### 7.4 Select / PhoneInput

Stejný border pattern jako Input. Select sheet search: `height 48px`, `rounded-xl`, `border-neutral-200`, `bg-light-primary`.

### 7.5 Switch / Toggle

| State | Track (Light) | Thumb |
|---|---|---|
| Off | `#F1F1F1` | `#FFFFFF`, shadow-sm |
| On | User accent (`#FF4F31` default) | `#FFFFFF` |

---

## 8. Cards

### 8.1 Media Card (`components/Card.tsx`)

Varianty: `classic` | `overlay` | `compact` | `minimal`

| Vlastnost | Light Mode |
|---|---|
| Placeholder bg | `#E5E5E5` (`neutral-200`) |
| Default radius | `8px` (`rounded-lg`) |
| Title | `14px`, `font-medium`, black |
| Meta / description | `12px`, `#6B7280` |
| Rating pill bg | `#F1F1F1` |
| Badge on image | `rgba(255,255,255,0.70)` |
| Shadow (optional) | preset `small` — viz Shadows |
| Overlay gradient | `transparent` → `rgba(0,0,0,0.3)` |

### 8.2 CustomCard (`components/CustomCard.tsx`)

| Vlastnost | Light Mode |
|---|---|
| Background | `#ffffff` |
| Border | `rgba(0,0,0,0.10)` |
| Default radius | `8px` (lg) |
| Default padding | `16px` (md) |
| Shadow (Android) | elevation 2–16 dle size |

### 8.3 Content / booking cards (běžný pattern)

```css
/* Default card */
background: var(--background-primary);
border: 1px solid var(--border-secondary); /* #E5E5E5 */
border-radius: var(--radius-2xl);          /* 16px */
padding: 20px;                             /* p-5 — web parity */

/* Card footer zone */
border-top: 1px solid var(--border-secondary);
background: var(--background-secondary);   /* #F1F1F1 */
```

Card **nesmí** na webu působit jako nový design — kopírovat aplikaci.

---

## 9. Navigation

### 9.1 Header (`components/Header.tsx`)

| Varianta | Light Mode |
|---|---|
| `default` | Background `#ffffff`, horizontal padding `24px` (global) |
| Title | `18px`, `font-bold`, `#000000` |
| Subtitle | `14px`, `font-medium`, `#525252` |
| Back / ghost action | `AppButton ghost icon` |
| Outline action | `AppButton outline icon`, 36×36 |
| Notification badge | `#EF4444` dot, border `#ffffff` |
| `transparent` | Gradient overlay, **white** text/icons (hero) |
| `blurred` | `bg-light-primary/60` + blur, white text |

### 9.2 Bottom tab bar (Android / custom)

| Vlastnost | Light Mode |
|---|---|
| Background | `#ffffff` |
| Top border | `1px solid #F1F1F1` |
| Icon inactive | `#000000`, opacity **0.4**, stroke 1.7, size 26px |
| Icon active | User accent, stroke 2.1 |
| Label active | Accent, `9px` |
| Label inactive | `#737373`, `9px` |
| Badge | `#EF4444`, 12×12, border `#ffffff` |

### 9.3 iOS native tabs

Tint color = user accent (`#FF4F31` default).

### 9.4 Status bar (Light Mode)

Dark icons on light background (`StatusBar style="dark"`).

### 9.5 Search bar

| Vlastnost | Light Mode |
|---|---|
| Container / pill bg | `#ffffff` |
| Pill height | 36px |
| Pill radius | full |
| Text | `14px`, `font-medium`, black |

---

## 10. Icons

Komponenta: **`Icon`** (`components/Icon.tsx`).

| Context | Light Mode |
|---|---|
| Default color | `#000000` (`colors.text`) |
| Default size | 24px |
| Default stroke | 2 |
| `variant="bordered"` | Border `#F1F1F1`, rounded-full |
| `variant="contained"` | Background `#F1F1F1`, rounded-full |
| Header icons | 22px; white override on transparent/blurred |
| List chevron | opacity 0.2, 24px |
| Inactive tab | opacity 0.4 |

**Icon size presets (container → icon):**

| Preset | Container | Icon |
|---|---|---|
| xs | 32×32 | 16px |
| s | 40×40 | 20px |
| m | 48×48 | 24px |
| l | 64×64 | 32px |
| xl | 80×80 | 40px |
| xxl | 96×96 | 48px |

Ikony **nemají** mít vlastní náhodné barvy mimo tokeny.

---

## 11. States

Každá interaktivní komponenta by měla mít definované stavy. V aplikaci se reálně používají:

| State | Implementace v app (Light) |
|---|---|
| Default | Viz tabulky výše |
| Hover | *Mobil nemá hover* — web může jemně navázat na pressed hodnoty |
| Active / pressed | `active:opacity-90`, `active:bg-black/5`, `active:bg-black/10` |
| Focus | Input: border `#A3A3A3`; web doporučen focus ring |
| Disabled | `opacity: 0.5` (buttons), snížená interakce |
| Selected | Choice chips, tabs — accent barva |
| Error | `#EF4444` border + text |
| Success | Pouze u textů/badge (ne u inputů) |

Pokud state aplikace nepoužívá, **nevytvářet** na webu uměle.

---

## 12. Typography

### 12.1 Doporučená hierarchie

| Úroveň | Tailwind v app | Size | Weight | Line height (Tailwind default) |
|---|---|---|---|---|
| Tab label | `text-[9px]` | 9px | normal | — |
| Caption / meta | `text-xs` | 12px | normal–medium | 16px |
| Body small | `text-sm` | 14px | normal–medium | 20px |
| Body | `text-base` | 16px | normal–medium | 24px |
| Body large | `text-lg` | 18px | bold (header title) | 28px |
| Heading 3 | `text-xl` | 20px | semibold | 28px |
| Heading 2 | `text-2xl` | 24px | semibold | 32px |
| Heading 1 | `text-3xl` | 30px | semibold | 36px |
| Display | `text-4xl` | 36px | semibold | 40px |

### 12.2 Section titles (`components/layout/Section.tsx`)

Prop `titleSize`: `sm` | `md` | `lg` | `xl` (default) | `2xl` | `3xl` | `4xl`  
Title: **`font-semibold`**. Subtitle: **`text-light-subtext`** (`#64748B`).

### 12.3 ThemedText

Default light: **`text-black`** (`#000000`). Barva se přepisuje přes `className`.

---

## 13. Border Radius

| Token | px | Tailwind | Typické použití |
|---|---|---|---|
| `--radius-sm` | 2 | `rounded-sm` | — |
| `--radius-md` | 6 | `rounded-md` | Default CTA button |
| `--radius-lg` | 8 | `rounded-lg` | Většina buttonů, media cards |
| `--radius-xl` | 12 | `rounded-xl` | Inputy |
| `--radius-2xl` | 16 | `rounded-2xl` | Booking/content cards |
| `--radius-full` | 9999 | `rounded-full` | Search pill, avatars, toggles |

Action sheets: **20px** top corners (inline style v app).

---

## 14. Spacing

### 14.1 Global spacing

**`p-global` = 24px** — primární horizontální padding obrazovek, headeru, scrolleru, footeru.

```css
--spacing-global: 24px;
```

### 14.2 Spacing scale (Tailwind — často používané)

| Token | px |
|---|---|
| 1 | 4 |
| 2 | 8 |
| 3 | 12 |
| 4 | 16 |
| 5 | 20 |
| 6 | 24 |
| 8 | 32 |
| 10 | 40 |
| 12 | 48 |
| 16 | 64 |

### 14.3 Section padding (`Section` component)

| Prop | Vertical px |
|---|---|
| sm | 8 |
| md | 16 |
| lg | 24 |
| xl | 32 |
| 2xl | 40 |
| 3xl | 48 |
| 4xl | 64 |

### 14.4 CustomCard padding

| Prop | px |
|---|---|
| sm | 8 |
| md | 16 (default) |
| lg | 24 |
| xl | 32 |

---

## 15. Shadows

Light Mode stíny (`utils/useShadow.ts`):

| Preset | shadowColor | shadowOpacity | shadowRadius | shadowOffset | elevation (Android) |
|---|---|---|---|---|---|
| Base default | `#000` | 0.15 | 3.84 | `{0, 2}` | 5 |
| `small` | `#000` | 0.15 | 2.5 | `{0, 1}` | 3 |
| `medium` | `#000` | 0.15 | 5 | `{0, 3}` | 8 |
| `large` | `#000` | 0.15 | 10.84 | `{0, 10}` | 15 |
| `card` | `#000` | 0.15 | 3.84 | `{0, 2}` | 4 |

**SearchBar pill (speciální):** opacity 0.3, radius 8.84, elevation 10.

Web CSS příklad:

```css
--shadow-sm: 0 1px 2.5px rgba(0, 0, 0, 0.15);
--shadow-md: 0 3px 5px rgba(0, 0, 0, 0.15);
--shadow-lg: 0 10px 10.84px rgba(0, 0, 0, 0.15);
```

Stín má být **jemný** — pouze hloubka, ne dekorace.

---

## 16. Semantic Colors

Centralizovaný semantic token soubor v app **zatím neexistuje** — hodnoty jsou v Tailwind třídách. Web by měl použít tyto hodnoty:

### Success

| Role | Hex | Použití |
|---|---|---|
| Text | `#16A34A` | Wallet credit |
| Text emphasis | `#059669` | Discount / savings |
| Dot / muted | `#4ADE80` | Online badge |
| Live indicator | `#10B981` | emerald-500 |

### Warning

| Role | Hex | Použití |
|---|---|---|
| Text | `#B45309` | Availability hints, coupon warnings |
| Background | `rgba(245, 158, 11, 0.10)` | Alert box bg (amber-500/10) |
| Border | `rgba(245, 158, 11, 0.40)` | Alert box border |
| Live indicator | `#F59E0B` | amber-500 |

### Error / Destructive

| Role | Hex | Použití |
|---|---|---|
| Strong | `#DC2626` | Destructive button, offline badge text |
| Default | `#EF4444` | Form errors, badges, input error |
| Badge ring | `rgba(220, 38, 38, 0.4)` | Offline indicator |

### Info

| Role | Hex | Použití |
|---|---|---|
| Text | `#64748B` | Secondary / info text |
| Border | `#E5E5E5` | Info hint box (neutral) |

---

## 17. Dark Mode

**Dark Mode není součástí tohoto tasku.**

Web již Dark Mode podporuje a není potřeba ho měnit.

Vývojář má pouze doplnit Light Mode a zajistit, aby přepínání mezi:

```text
Dark Mode
Light Mode
```

fungovalo prostřednictvím stejného systému jako v aplikaci (theme context / `data-theme` / class na root).

---

## 18. Doporučená implementace na webu

```css
:root,
[data-theme="light"] {
  /* Light Mode — viz sekce 2.2 */
}

[data-theme="dark"] {
  /* Existující Dark Mode — beze změny */
}
```

Komponenty **nemají** používat:

```css
background: #ffffff;
color: #000000;
```

Komponenty **mají** používat:

```css
background: var(--background-primary);
color: var(--text-primary);
border-color: var(--border-secondary);
```

### Doporučený postup

1. Definovat CSS variables podle sekce 2.2.
2. Namapovat existující web komponenty na stejné varianty jako `AppButton`.
3. Sjednotit input styly s `Input` komponentou (animated/classic).
4. Sjednotit card pattern (`rounded-2xl`, `border-neutral-200`, `p-5`).
5. Použít `--spacing-global: 24px` jako horizontální padding layoutu.
6. Ověřit accent color mechanismus (default `#FF4F31`).
7. Visual QA: app screenshot ↔ web screenshot stejné obrazovky.

---

## 19. Hlavní pravidlo

**Aplikace je source of truth.**

Pokud je nějaká hodnota nebo komponenta v aplikaci již definovaná, web by měl tuto hodnotu převzít.

Vývojář by neměl vytvářet vlastní alternativní Light Mode design.

Cílem je, aby uživatel při přechodu mezi aplikací a webem měl pocit, že používá **jeden produkt a jeden design systém**.

---

## 20. Checklist — co převést z aplikace

Pro finální implementaci:

- [x] Light Mode barvy (viz sekce 2)
- [x] Background colors (sekce 3)
- [x] Text colors (sekce 4)
- [x] Border colors (sekce 5)
- [x] Brand colors (sekce 2)
- [x] Semantic colors (sekce 16)
- [x] Button variants (sekce 6)
- [x] Input styles (sekce 7)
- [x] Card styles (sekce 8)
- [x] Navigation styles (sekce 9)
- [x] Icon colors (sekce 10)
- [x] Typography (sekce 12)
- [x] Border radius (sekce 13)
- [x] Spacing (sekce 14)
- [x] Shadows (sekce 15)
- [x] Active / pressed states (sekce 11)
- [x] Disabled states (sekce 6, 11)
- [x] Error states (sekce 7, 16)
- [ ] Hover states — web-only, navázat na pressed hodnoty
- [ ] Focus states — web doplnit focus ring
- [ ] Success input state — **v app neexistuje, neimplementovat**

---

## Reference — klíčové soubory v aplikaci

```
tailwind.config.js              → Tailwind color + spacing tokens
contexts/ThemeColors.tsx        → Runtime theme hook
contexts/AccentColorContext.tsx → User accent color
constants/buttonTokens.ts       → Button semantic tokens
constants/buttonVariants.ts     → AppButton variant definitions
components/AppButton.tsx        → Global button component
components/forms/Input.tsx      → Input component
components/Card.tsx             → Media card
components/CustomCard.tsx       → Generic card wrapper
components/Header.tsx           → Screen header
components/TabButton.tsx        → Bottom tab bar
components/ThemedText.tsx       → Base text
components/layout/Section.tsx   → Section spacing/titles
utils/useShadow.ts              → Shadow presets
app/(tabs)/_layout.tsx          → Tab navigation layout
```

---

## Výsledek

**Kompletní Light Mode design systém pro web**, který vizuálně kopíruje Light Mode současné aplikace.

Dark Mode zůstává beze změny.
