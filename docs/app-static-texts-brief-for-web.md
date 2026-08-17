# Zadání: Statické texty mobilní app — ukrajinština + sjednocení CS/EN s webem

**Pro:** vývojový tým nového webu Real Barber  
**Od:** tým mobilní app (Real Barber Client, Expo)  
**Cíl:** Připravit kompletní překladovou tabulku pro statické UI texty appky a zároveň označit místa, kde se liší naše čeština/angličtina od textace na webu.

---

## Kontext

Mobilní app dnes podporuje **češtinu** a **angličtinu**. Statické texty (tlačítka, labely, chyby, empty states, booking flow atd.) jsou v souborech `locales/cs.ts` a `locales/en.ts` pod **klíči** (`key`), stejným principem jako i18n na webu.

**Ukrajinštinu** z API už dostáváme (`nameUk`, `descriptionUk`, …). Chybí nám ale **statické UI texty v UK** — ty potřebujeme doplnit stejným způsobem jako CS/EN.

Zároveň chceme **sjednotit textaci** napříč webem a appkou: pokud u vás na webu platí jiná čeština nebo angličtina než v naší exportované tabulce, napište nám to — my appku podle vás upravíme.

---

## Co od vás potřebujeme

### 1. Vyplnit ukrajinštinu (`uk`)

Pro každý řádek tabulky doplňte sloupec **`uk`**.

- Použijte **stejnou terminologii** jako na hotovém webu v ukrajinštině.
- Každý řádek musí mít `uk` vyplněné (100 % pokrytí).

### 2. Označit rozdíly v češtině a angličtině (volitelné sloupce)

Sloupce **`cs`** a **`en`** v tabulce jsou **aktuální texty z mobilní app** (referenční).

Pokud u vás na webu platí **jiný wording** pro stejný význam, vyplňte:

| Sloupec | Kdy vyplnit |
|---------|-------------|
| **`cs_web_suggested`** | Jen když se vaše čeština **liší** od sloupce `cs` |
| **`en_web_suggested`** | Jen když se vaše angličtina **liší** od sloupce `en` |

Pokud je text na webu stejný jako v appce, **nechte `cs_web_suggested` / `en_web_suggested` prázdné**.

Do **`notes_for_translator`** uveďte stručně proč navrhujete změnu (kontext, délka, brand, jiný tab na webu atd.).

**Příklad:**

| key | cs | en | uk | cs_web_suggested | en_web_suggested | notes_for_translator |
|-----|----|----|-----|------------------|------------------|----------------------|
| `tabInspirace` | Inspirace | Inspiration | … | Účesy | Haircuts | Na webu je sekce pojmenovaná Účesy / Haircuts |

### 3. Pravidla pro všechny jazyky

1. **Neměnit `key`** — jsou to programové identifikátory, musí zůstat 1:1 s appkou.
2. **Zachovat placeholdery** beze změny — např. `{name}`, `{date}`, `{channel}` (v textu musí zůstat přesně `{název}`).
3. **Multiline texty** — zachovat odřádkování tam, kde je v CS/EN.
4. **Brand a názvy** — Real Barber, RB Coins, RBC atd. držet konzistentně s webem.
5. **Nepřekládat obsah z CRM** — názvy holičů, služeb, popisy z administrace do tabulky nepatří (ty řeší API).

### Placeholdery v appce (27 typů — neměnit)

`{avg}`, `{branch}`, `{channel}`, `{contact}`, `{count}`, `{current}`, `{date}`, `{days}`, `{day}`, `{details}`, `{distance}`, `{email}`, `{employee}`, `{end}`, `{location}`, `{minutes}`, `{month}`, `{name}`, `{phone}`, `{remaining}`, `{required}`, `{spent}`, `{start}`, `{status}`, `{time}`, `{url}`, `{when}`

---

## Formát dodávky

**Preferovaně:** upravený CSV nebo Google Sheet se sloupci:

| Sloupec | Povinný | Popis |
|---------|---------|--------|
| `key` | ✅ | Identifikátor z appky — neměnit |
| `section` | info | Sekce pro orientaci (Search, Settings, Booking, …) |
| `cs` | ✅ referenční | Aktuální text v appce (CS) |
| `en` | ✅ referenční | Aktuální text v appce (EN) |
| `uk` | ✅ | **Váš ukrajinský překlad** |
| `cs_web_suggested` | pokud liší | Navrhovaná CS textace z webu |
| `en_web_suggested` | pokud liší | Navrhovaná EN textace z webu |
| `notes_for_translator` | volitelný | Poznámky, kontext, důvod změny |

**Vstupní soubor:** `app-static-texts-template.csv` (~1 400 klíčů, CS + EN vyplněné, ostatní sloupce prázdné).

---

## Co do tabulky nepatří (out of scope)

- názvy holičů, poboček, služeb z CRM
- recenze, bio, popisy účesů z API
- mock / testovací data

Tyto texty appka bere z API (`name`, `nameEn`, `nameUk`, …) — ukrajinština tam už funguje na backendu.

---

## Co uděláme my po obdržení

1. Vytvoříme **`locales/uk.ts`** a zapneme ukrajinštinu v appce (stejný pattern jako CS/EN).
2. Projdete řádky s vyplněným **`cs_web_suggested` / `en_web_suggested`** — u nás v appce upravíme `cs.ts` / `en.ts` podle vašich návrhů (sjednocení s webem).
3. Otestujeme UI ve všech třech jazycích.

---

## Kontakt / dotazy

Při nejasnosti u konkrétního klíče (`key`) nebo kontextu použití textu v appce nás kontaktujte — doplníme screenshot nebo vysvětlení obrazovky.

**Děkujeme — cílem je jedna konzistentní textace Real Barber na webu i v mobilní app ve všech třech jazycích.**
