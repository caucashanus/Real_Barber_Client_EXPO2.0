# Schované prvky v aplikaci (dočasné přepínače)

Tento dokument popisuje všechny části UI, které jsou v kódu **stále přítomné**, ale **nejsou zobrazené**, protože je řídí konstanty `SHOW_* = false`.

**Důležité:** Až budete funkce znovu zapínat do produkce, **odstraňte celé řádky s těmito konstantami** a podmíněné renderování (`{SHOW_* ? (…) : null}`) – nahraďte je přímým vykreslením komponent. Přepínače `true` / `false` slouží **jen pro současné skrytí** během vývoje / mockup fáze, nejsou určené jako trvalá architektura.

---

## Nastavení — `app/screens/settings.tsx`

| Konstanta | Výchozí | Kde v UI | Co to bylo |
|-----------|---------|----------|------------|
| `SHOW_SETTINGS_PAYMENTS_SECTION` | `false` | Sekce pod „Akcent“ | Položka **Platby** (ikona karty), popisek o správě platebních metod. Odkaz na `/screens/profile/payments` (obrazovka platebních karet – mock karty, Apple/Google Pay bloky). |
| `SHOW_SETTINGS_CURRENCY_SECTION` | `false` | Mezi Oznámeními a Heslem | Položka **Měna** (ikona `$`), popisek. Odkaz na `/screens/profile/currency`. |
| `SHOW_SETTINGS_HELP_SECTION` | `false` | Nad odhlášením (u hesla) | Položka **Nápověda** (ikona otazníku). Odkaz na `/screens/help` (FAQ / nápověda). |
| `SHOW_SETTINGS_NOTIFICATIONS_SECTION` | `false` | Mezi Platbami a Měnou | Položka **Oznámení** (zvonek). Odkaz na `/screens/profile/notifications` (nastavení upozornění). |

**Překlady (CS):** `settingsPayments`, `settingsCurrency`, `settingsHelp`, `settingsNotifications` a jejich `*Desc` v `locales/cs.ts` / `en.ts`.

---

## Profil — `app/(tabs)/profile.tsx`

| Konstanta | Výchozí | Kde v UI | Co to bylo |
|-----------|---------|----------|------------|
| `SHOW_PROFILE_HEADER_NOTIFICATIONS` | `false` | **Hlavička vpravo nahoře** | Ikona **zvonku** (Bell) → `/screens/notifications` (seznam / obrazovka oznámení). |
| `SHOW_PROFILE_HELP_SECTION` | `false` | Seznam pod úpravou profilu | Položka **Nápověda** → `/screens/help`. |
| `SHOW_PROFILE_REFERRALS_SECTION` | `false` | Nad oddělovačem před Odhlášením | Položka **Doporučení** (ikona dárku) → `/screens/referrals`. |

Levý horní roh (přepínač tématu) a zbytek profilu (účet, úprava profilu, odhlášení) zůstávají viditelné.

---

## Peněženka — `app/(tabs)/(home)/wallet.tsx`

| Konstanta | Výchozí | Kde v UI | Co to bylo |
|-----------|---------|----------|------------|
| `SHOW_WALLET_MORE_RBC` | `false` | **Pod zůstatkem RBC** + **čtvrté tlačítko v řádku** | Outline tlačítko „**Více**“ (`walletMoreButton`) a akce „**Více**“ s ikonou `MoreVertical` – obě vedou na `/screens/rbc` (RBC sekce). |
| `SHOW_WALLET_ADD_MONEY_AND_DETAILS` | `false` | **Řádek akcí** pod kartou zůstatku | První položka **Přidat peníze** (Plus) a třetí **Detail** (Building2) – zatím bez vlastní navigace (mock). Viditelné zůstává **Převod** (šipky). |
| `SHOW_WALLET_HORIZONTAL_PROMO_CARDS` | `false` | **Pod akčním řádkem** | Horizontálně posuvné **široké karty** (promo: Flexi fondy + 2 další), stín, tlačítko X (skrytí na 24 h, AsyncStorage). |

**Viditelné dál:** karta zůstatku RBC, **Převod**, sekce **Transakce**, odkaz „Zobrazit vše“ na historii, modal detailu transakce.

---

## Produkty — `app/(tabs)/(home)/products.tsx`

| Konstanta | Výchozí | Kde v UI | Co to bylo |
|-----------|---------|----------|------------|
| `SHOW_PRODUCTS_PROMO_STRIP` | `false` | **Pod „Moje nákupy“** | Horizontální pás **promo karet** (5 karet s titulkem + podtitulkem, X pro skrytí na 24 h). |
| `SHOW_PRODUCTS_CATALOG_CAROUSEL` | `false` | **Spodek obrazovky** | Sekce **Produkty** s odkazem „Zobrazit vše“ na mapu + horizontální **CardScroller** s **mock produkty** (vosk, gel, šampon, olej – obrázek `barbers.png`). |

**Vždy viditelné:** sekce **Moje nákupy** s `CardScroller` – načítání z API (`getClientProducts`), karty nákupů, navigace na detail produktu.

---

## Welcome (Vítejte zpět) — `app/screens/welcome.tsx`

| Konstanta | Výchozí | Kde v UI | Co to bylo |
|-----------|---------|----------|------------|
| `SHOW_WELCOME_GOOGLE_APPLE_BUTTONS` | `false` | Pod hlavním CTA tlačítkem | Dvě tlačítka **Continue with Google** / **Pokračovat přes Google** a **Continue with Apple** / **Pokračovat přes Apple** (ikony AntDesign), obě mock navigace na `/(tabs)/(home)`. |

**Viditelné dál:** přepínač tématu, přepínač jazyka (EN/CS), nadpis „Welcome back“ / „Vítejte zpět“, podtitulek, hlavní tlačítko **Start** / **Začít** → `/screens/login`.

**Překlady:** `welcomeContinueGoogle`, `welcomeContinueApple` v `locales/cs.ts` / `en.ts`.

---

## Obnovení do ostrého provozu (doporučený postup)

1. Pro každou funkci, kterou chcete znovu ukázat uživatelům, **smažte** příslušnou `const SHOW_* = false` a **odstraňte** obal `{SHOW_* ? (…) : null}` tak, aby komponenty byly v JSX přímo (bez podmínky).
2. Ověřte navigaci a překlady.
3. Tento soubor můžete po dokončení **smazat** nebo z něj udělat krátkou poznámku do `README`, pokud už nebude aktuální.

---

*Vygenerováno jako přehled schovaných prvků; při změnách v kódu konstanty aktualizujte ručně.*
