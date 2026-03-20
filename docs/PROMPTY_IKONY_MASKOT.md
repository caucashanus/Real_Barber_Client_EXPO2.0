# Prompty pro generování ikon s firemním maskotem

Cíl: jednotné vizuály pro flow „Přidat účes“, všechny ikony v jednom stylu s firemním maskotem jako hlavní postavou.

**Před použitím:** Do každého promptu doplňte jméno nebo krátký popis vašeho maskota (např. „Real Barber panáček“, „RB mascot“) tam, kde je `[JMÉNO / POPIS MASKOTA]`. Pro nejlepší konzistenci nahrajte do nástroje i referenční obrázek maskota (pokud to nástroj umí).

---

## Obecná doporučení pro všechny prompty

- **Formát:** čtverec (1:1), PNG. Velikosti exportu viz tabulku „Požadované velikosti ikon“ níže – odpovídají místům použití v aplikaci.
- **Styl:** Moderní, semi-realistický vzhled – ne kreslený/cartoon. Čisté linie, profesionální dojem, konzistentní s firemním maskotem. Vyhněte se přehnaně animovanému nebo dětskému stylu.
- **Pozadí:** Průhledné (transparent) – žádné barevné pozadí, aby ikona v aplikaci vypadala dobře na bílém i černém pozadí. Exportujte PNG s alfa kanálem.

---

## Seznam všech ikon vhodných pro jednotný (mascot) styl

Níže je kompletní přehled ikon/obrázků v projektu, které dávají smysl mít ve **stejném stylu** (s maskotem). Pro všechny položky 1–11 (flow + tab bar) už v dokumentu máte hotové prompty.

| # | Soubor | Kde se používá | Poznámka |
|---|--------|----------------|----------|
| **1** | `assets/img/myidea.png` | Flow „Přidat účes“ krok 1, úvodní karta Moje účesy | Vytvoř si svůj účes |
| **2** | `assets/img/myrules.png` | Flow „Přidat účes“ krok 2, úvodní karta Moje účesy | Dej svému účesu pravidla |
| **3** | `assets/img/savefinish.png` | Flow „Přidat účes“ krok 3, úvodní karta Moje účesy | Finishujeme a ukládáme |
| **4** | `assets/img/gratulations.png` | Stránka Congratulations po dokončení wizardu | Gratulujeme |
| **5** | `assets/img/wallet.png` | Tab bar: Wallet | Peněženka |
| **6** | `assets/img/my-haircuts.png` | Tab bar: My haircuts | Moje střihy |
| **7** | `assets/img/branches.png` | Tab bar: Branches | Pobočky |
| **8** | `assets/img/guides.png` | Tab bar: Guides | Průvodce |
| **9** | `assets/img/barbers.png` | Tab bar: Barbers | Barbeři |
| **10** | `assets/img/services.png` | Tab bar: Services | Služby |
| **11** | `assets/img/products.png` | Tab bar: Products | Produkty |

### Požadované velikosti ikon (stejné jako na místech použití v appce)

Všechny ikony jsou v kódu zobrazené jako **čtverce**. Exportujte PNG ve velikosti podle tabulky (nebo 2× pro Retina). Velikosti odpovídají aktuálnímu použití v aplikaci.

| # | Soubor | Zobrazená velikost v aplikaci | Doporučený export (PNG čtverec) |
|---|--------|--------------------------------|----------------------------------|
| 1 | `myidea.png` | 64×64 px (kroky flow), 80×80 px (karta Moje účesy) | **80×80 px** (nebo 160×160 px pro 2× Retina) |
| 2 | `myrules.png` | 64×64 px (kroky flow), 80×80 px (karta Moje účesy) | **80×80 px** (nebo 160×160 px pro 2× Retina) |
| 3 | `savefinish.png` | 64×64 px (kroky flow), 80×80 px (karta Moje účesy) | **80×80 px** (nebo 160×160 px pro 2× Retina) |
| 4 | `gratulations.png` | 128×128 px (stránka Congratulations) | **128×128 px** (nebo 256×256 px pro 2× Retina) |
| 5 | `wallet.png` | 45×45 px (tab bar) | **45×45 px** (nebo 90×90 px pro 2× Retina) |
| 6 | `my-haircuts.png` | 45×45 px (tab bar) | **45×45 px** (nebo 90×90 px pro 2× Retina) |
| 7 | `branches.png` | 45×45 px (tab bar) | **45×45 px** (nebo 90×90 px pro 2× Retina) |
| 8 | `guides.png` | 45×45 px (tab bar) | **45×45 px** (nebo 90×90 px pro 2× Retina) |
| 9 | `barbers.png` | 45×45 px (tab bar) | **45×45 px** (nebo 90×90 px pro 2× Retina) |
| 10 | `services.png` | 45×45 px (tab bar) | **45×45 px** (nebo 90×90 px pro 2× Retina) |
| 11 | `products.png` | 45×45 px (tab bar) | **45×45 px** (nebo 90×90 px pro 2× Retina) |

*Pokud chcete jednu velikost pro všechny (např. 512×512 px), aplikace obrázky v kódu zmenší; důležité je zachovat poměr 1:1 (čtverec).*

### Specifikace ikon pro kód (kam dát soubory a v jakém formátu)

Aby ikony v aplikaci správně fungovaly, dodržujte:

| Požadavek | Hodnota |
|-----------|--------|
| **Formát** | **PNG** (s průhledností – alfa kanál) |
| **Poměr stran** | **1 : 1** (čtverec) |
| **Rozlišení tab bar** (wallet, my-haircuts, branches, guides, barbers, services, products) | **45×45 px** nebo **90×90 px** (doporučeno 90×90 pro ostrost na Retina) |
| **Rozlišení flow „Přidat účes“** (myidea, myrules, savefinish) | **80×80 px** nebo **160×160 px** |
| **Rozlišení gratulations** | **128×128 px** nebo **256×256 px** |
| **Složka v projektu** | `assets/img/` |
| **Použití v kódu** | `require('@/assets/img/nazev.png')` |

**Přesné názvy souborů, které kód očekává:**

- `wallet.png`, `my-haircuts.png`, `branches.png`, `guides.png`, `barbers.png`, `services.png`, `products.png` – tab bar (každá záložka má vlastní ikonu v `components/HomeTabs.tsx`)
- `myidea.png`, `myrules.png`, `savefinish.png`, `gratulations.png` – flow Přidat účes a Congratulations

**Důležité:** V `components/HomeTabs.tsx` se používají **7 samostatných obrázků** pro tab bar. Pro nahrazení jednotným stylem s maskotem vygenerujte a nahraďte těchto 7 souborů.

**Celkem: 11 ikon** (4 úvod + 7 tab bar). **+ 11 ikon pro krok 2 wizardu** (What best describes your haircut? / For which season?) – prompty v sekci „Ikony pro krok 2 wizardu“ (ikony 8–18). Vše ve stejném semi-realistickém stylu s maskotem a průhledným pozadím.

### Volitelně (velké ikony na celoobrazovkách)

Na těchto obrazovkách je dnes **velká Lucide ikona** (ne obrázek). Pokud chcete i tady jednotný vizuál, můžete vygenerovat jednu ilustraci s maskotem a v kódu ji použít místo ikony:

| Místo | Soubor | Aktuálně | Návrh |
|-------|--------|----------|--------|
| Stránka 404 (nic nenalezeno) | nový obrázek | `Icon name="AlertCircle"` size 70 | Maskot s „?“ nebo pátrajícím výrazem |
| Povolení lokace | nový obrázek | `Icon name="MapPinned"` size 80 | Maskot s mapou / pinem |

### Co záměrně neřešíme v jednotném stylu

- **Lucide ikony v UI** (CreditCard, Calendar, Bell, ChevronRight, atd.) – používají se v seznamech, tlačítkách, hlavičkách. Zůstávají systémové; nahrazovat desítky ikon vlastními obrázky by bylo náročné a mohlo by rozbít čitelnost.
- **Placeholdery obsahu** – `room-*.avif`, `user-*.jpg`, `thomino.jpg` (fotky služeb, produktů, avatarů). Jsou to reálný obsah, ne „ikony“.
- **Wallet / mapa / pobočky** – `realbarber.png`, `RB.avatar.jpg`, `markers/*.png`, `branches/*.jpg` – branding a fotky míst; jednotný mascot styl je volitelný.

---

## 1. Ikona: „Vytvoř si svůj účes“

**Soubor:** `myidea.png`  
**Velikost:** 80×80 px (zobrazení 64 px v krocích, 80 px na kartě Moje účesy). Export: **80×80 px** nebo 160×160 px (2× Retina), čtverec PNG.  
**Sekce:** Krok 1 na úvodní stránce  
**Text:** Vytvoř si svůj účes – Vymysli název a tvoř.

**Prompt (CZ):**

```
Ilustrace pro mobilní aplikaci kadeřnictví. Firemní maskot [JMÉNO / POPIS MASKOTA] v centru scény vytváří nebo vymýšlí svůj účes: buď si prohlíží v zrcadle nápad na účes, nebo má nad hlavou bublinu s nápadem / nůžkami / náčrtem účesu. Výraz soustředěný, kreativní, spokojený.

Formát: čtverec nebo 1:1, vhodné pro ikonu v UI (např. 512×512 px nebo 1024×1024). Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, profesionální dojem, konzistentní s firemním maskotem. Vyhněte se přehnaně animovanému nebo dětskému stylu. Pozadí: průhledné (transparent) – žádné barevné pozadí, export PNG s alfa kanálem, aby ikona vypadala dobře na jakémkoli pozadí v aplikaci (světlý i tmavý režim). Čtvercový formát, vhodné jako ikona v aplikaci. Jednotný vizuální styl značky.
```

**Prompt (EN – pro nástroje fungující lépe v angličtině):**

```
Mobile app illustration for a barbershop. Brand mascot character [MASCOT NAME] in the center, creating or imagining his haircut: either looking in a mirror at a haircut idea, or with a thought bubble above his head showing a haircut sketch or scissors. Focused, creative, satisfied expression.

Format: square or 1:1, suitable for a UI icon (e.g. 512×512 or 1024×1024 px). Style: modern, semi-realistic look – not cartoon or drawn. Clean lines, professional feel, consistent with the brand mascot. Avoid overly animated or childish style. Background: transparent – no colored background, export PNG with alpha channel so the icon looks good on any app background (light or dark mode). Square format, suitable as an app icon. Cohesive brand visual identity.
```

---

## 2. Ikona: „Dej svému účesu pravidla“

**Soubor:** `myrules.png`  
**Velikost:** 80×80 px (zobrazení 64 px v krocích, 80 px na kartě Moje účesy). Export: **80×80 px** nebo 160×160 px (2× Retina), čtverec PNG.  
**Sekce:** Krok 2 na úvodní stránce  
**Text:** Dej svému účesu pravidla – Přidej fotky, popis, tvoje preference, přesně tak jak chceš TY.

**Prompt (CZ):**

```
Ilustrace pro mobilní aplikaci kadeřnictví. Firemní maskot [JMÉNO / POPIS MASKOTA] dává svému účesu pravidla: například drží mobil nebo tablet a přidává fotky / popis účesu, nebo má před sebou „seznam pravidel“ (ikona checklistu, fotky, text). Výraz aktivní, rozhodný, „já si to nastavím“.

Formát: čtverec nebo 1:1, vhodné pro ikonu v UI (např. 512×512 px nebo 1024×1024). Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, profesionální dojem, konzistentní s firemním maskotem. Vyhněte se přehnaně animovanému nebo dětskému stylu. Pozadí: průhledné (transparent) – žádné barevné pozadí, export PNG s alfa kanálem, aby ikona vypadala dobře na jakémkoli pozadí v aplikaci (světlý i tmavý režim). Čtvercový formát, vhodné jako ikona v aplikaci. Jednotný vizuální styl značky.
```

**Prompt (EN):**

```
Mobile app illustration for a barbershop. Brand mascot [MASCOT NAME] setting rules for his haircut: e.g. holding a phone or tablet and adding photos or a description of the haircut, or with a “rules checklist” in front of him (checklist icon, photos, text). Active, determined expression, “I’m in control”. Style: modern semi-realistic look, clean lines, professional – not cartoon or overly animated. Consistent with the brand mascot. Background: transparent – no colored background, export PNG with alpha channel so the icon looks good on any app background (light or dark mode). Square format, suitable as an app icon. Cohesive brand visual identity.
```

---

## 3. Ikona: „Finishujeme a ukládáme“

**Soubor:** `savefinish.png`  
**Velikost:** 80×80 px (zobrazení 64 px v krocích, 80 px na kartě Moje účesy). Export: **80×80 px** nebo 160×160 px (2× Retina), čtverec PNG.  
**Sekce:** Krok 3 na úvodní stránce  
**Text:** Finishujeme a ukládáme – Přijď si pro svůj vysněný fresh cut a nikomu nic nevysvětluj.

**Prompt (CZ):**

```
Ilustrace pro mobilní aplikaci kadeřnictví. Firemní maskot [JMÉNO / POPIS MASKOTA] v momentu „hotovo a uloženo“: spokojeně odchází s perfektním účesem, nebo dává palec nahoru / má úsměv a vedle něj je ikona uložení (disketa, zaškrtnutí). Může mít čerstvě ostříhané vlasy. Výraz spokojený, uvolněný, „mám to“. Formát: čtverec nebo 1:1, vhodné pro ikonu v UI (např. 512×512 px nebo 1024×1024). Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, profesionální dojem, konzistentní s firemním maskotem. Vyhněte se přehnaně animovanému nebo dětskému stylu. Pozadí: průhledné (transparent) – žádné barevné pozadí, export PNG s alfa kanálem, aby ikona vypadala dobře na jakémkoli pozadí v aplikaci (světlý i tmavý režim). Čtvercový formát, vhodné jako ikona v aplikaci. Jednotný vizuální styl značky.
```

**Prompt (EN):**

```
Mobile app illustration for a barbershop. Brand mascot [MASCOT NAME] in the “done and saved” moment: walking away happily with a perfect haircut, or giving a thumbs up / smiling with a “saved” icon (checkmark, save symbol) nearby. Can have a fresh haircut. Expression satisfied, relaxed, "I've got it".

Format: square or 1:1, suitable for a UI icon (e.g. 512×512 or 1024×1024 px). Style: modern, semi-realistic look – not cartoon or drawn. Clean lines, professional feel, consistent with the brand mascot. Avoid overly animated or childish style. Background: transparent – no colored background, export PNG with alpha channel so the icon looks good on any app background (light or dark mode). Square format, suitable as an app icon. Cohesive brand visual identity.
```

---

## 4. Ikona: „Gratulujeme“ / Congratulations

**Soubor:** `gratulations.png`  
**Velikost:** 128×128 px (zobrazení na stránce Congratulations). Export: **128×128 px** nebo 256×256 px (2× Retina), čtverec PNG.  
**Sekce:** Závěrečná stránka po dokončení wizardu (Success step)  
**Text:** Gratulujeme! – Váš účes byl úspěšně uložen. Najdete ho v sekci Moje účesy.

**Prompt (CZ):**

```
Ilustrace pro mobilní aplikaci kadeřnictví. Firemní maskot [JMÉNO / POPIS MASKOTA] slaví úspěch: dává palec nahoru, má velký úsměv, může mít ruce zdvižené v gestu oslavy. Volitelně jemné prvky oslavy kolem něj – konfety, jiskřičky, malá záře. Výraz nadšený, spokojený, „povedlo se“.

Formát: čtverec nebo 1:1, vhodné pro ikonu v UI (např. 512×512 px nebo 1024×1024). Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, profesionální dojem, konzistentní s firemním maskotem. Vyhněte se přehnaně animovanému nebo dětskému stylu. Pozadí: průhledné (transparent) – žádné barevné pozadí, export PNG s alfa kanálem, aby ikona vypadala dobře na jakémkoli pozadí v aplikaci (světlý i tmavý režim). Čtvercový formát, vhodné jako ikona na stránce Gratulujeme. Jednotný vizuální styl značky.
```

**Prompt (EN):**

```
Mobile app illustration for a barbershop. Brand mascot [MASCOT NAME] celebrating success: giving a thumbs up, big smile, arms possibly raised in a celebration gesture. Optional subtle celebration elements around him – confetti, sparkles, soft glow. Expression excited, satisfied, "we did it".

Format: square or 1:1, suitable for a UI icon (e.g. 512×512 or 1024×1024 px). Style: modern, semi-realistic look – not cartoon or drawn. Clean lines, professional feel, consistent with the brand mascot. Avoid overly animated or childish style. Background: transparent – no colored background, export PNG with alpha channel so the icon looks good on any app background (light or dark mode). Square format, suitable as an icon on the Congratulations screen. Cohesive brand visual identity.
```

---

## Ikony pro krok 2 wizardu (What best describes your haircut? / For which season?)

V wizardu „Přidat účes“ (`app/screens/add-property.tsx`) jsou u kroků **What best describes your haircut?** a **For which season?** volby s Lucide ikonami. Níže jsou prompty pro **vlastní PNG ikony** ve stejném stylu jako myidea / myrules / savefinish (maskot, průhledné pozadí, čtverec). Po vygenerování je v kódu nahradíte místo ikon.

**Důležité:** Tyto ikony jsou **obecné (koncept / situace)** – maskot je v daném kontextu (kancelář, sport, léto…), **ne** doslovné „typ účesu“ ani barber/střih. Cíl: srozumitelný symbol pro volbu v UI bez toho, aby každá ikona vypadala jako „něco o stříhání“.

**Použití v kódu:** `propertyTypeOptions` (8 ikon), `guestAccessOptions` (3 ikony). Doporučený export: čtverec PNG 512×512 px (nebo 80×80 px), průhledné pozadí.

| # | Volba (label) | Navrhovaný soubor | Aktuální Lucide ikona |
|---|---------------|-------------------|------------------------|
| 8 | Shorter | `type-shorter.png` | CircleDot |
| 9 | Medium length | `type-medium-length.png` | Ruler |
| 10 | Longer | `type-longer.png` | Maximize |
| 11 | Office | `type-office.png` | Briefcase |
| 12 | Sporty | `type-sporty.png` | Dumbbell |
| 13 | Modern | `type-modern.png` | Sparkles |
| 14 | Retro | `type-retro.png` | Clock |
| 15 | Casual | `type-casual.png` | Home |
| 16 | Summer | `season-summer.png` | Sun |
| 17 | Winter | `season-winter.png` | Snowflake |
| 18 | All-year | `season-all-year.png` | Calendar |

---

### 8. Ikona: Shorter (Kratší)

**Soubor:** `type-shorter.png`  
**Velikost:** čtverec PNG, průhledné pozadí (např. 512×512 px nebo 80×80 px).  
**Koncept:** Obecný symbol „krátké / malé“ – bez vázání na účes nebo stříhání.

**Prompt (CZ):**

```
Ilustrace pro mobilní aplikaci. Firemní maskot [JMÉNO / POPIS MASKOTA] představuje koncept „krátké / malé“: např. gesto rukou (krátká vzdálenost), ukazuje na něco malého, nebo drží malý předmět. Žádné nůžky, vlasy ani barber kontext. Výraz jasný, srozumitelný. Obecná ikona pro volbu „Shorter“.

Formát: čtverec 1:1. Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, konzistentní s firemním maskotem. Pozadí: průhledné (transparent), export PNG s alfa kanálem.
```

**Prompt (EN):**

```
Mobile app illustration. Brand mascot [MASCOT NAME] representing the concept “short / small”: e.g. hand gesture (short distance), pointing at something small, or holding a small object. No scissors, hair or barber context. Clear, understandable expression. Generic icon for “Shorter” option.

Format: square 1:1. Style: modern, semi-realistic look – not cartoon or drawn. Clean lines, consistent with the brand mascot. Background: transparent, export PNG with alpha channel.
```

---

### 9. Ikona: Medium length (Střední délka)

**Soubor:** `type-medium-length.png`  
**Koncept:** Obecný symbol „střední / vyvážené“ – bez vázání na vlasy nebo stříhání.

**Prompt (CZ):**

```
Ilustrace pro mobilní aplikaci. Firemní maskot [JMÉNO / POPIS MASKOTA] představuje koncept „střední / vyvážené“: např. pravítko nebo gesto „uprostřed“, rovnováha, něco mezi malým a velkým. Žádné vlasy ani barber kontext. Výraz vyrovnaný, profesionální. Obecná ikona pro volbu „Medium length“.

Formát: čtverec 1:1. Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, konzistentní s firemním maskotem. Pozadí: průhledné (transparent), export PNG s alfa kanálem.
```

**Prompt (EN):**

```
zve
```

---

### 10. Ikona: Longer (Delší)

**Soubor:** `type-longer.png`  
**Koncept:** Obecný symbol „dlouhé / velké“ – bez vázání na účes nebo stříhání.

**Prompt (CZ):**

```
Ilustrace pro mobilní aplikaci. Firemní maskot [JMÉNO / POPIS MASKOTA] představuje koncept „dlouhé / velké“: např. gesto rukou (dlouhá vzdálenost), ukazuje na něco dlouhého nebo velkého, nebo drží dlouhý předmět. Žádné vlasy ani barber kontext. Výraz uvolněný, srozumitelný. Obecná ikona pro volbu „Longer“.

Formát: čtverec 1:1. Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, konzistentní s firemním maskotem. Pozadí: průhledné (transparent), export PNG s alfa kanálem.
```

**Prompt (EN):**

```
Mobile app illustration. Brand mascot [MASCOT NAME] representing the concept “long / large”: e.g. hand gesture (long distance), pointing at something long or big, or holding a long object. No hair or barber context. Relaxed, understandable expression. Generic icon for “Longer” option.

Format: square 1:1. Style: modern, semi-realistic look – not cartoon or drawn. Clean lines, consistent with the brand mascot. Background: transparent, export PNG with alpha channel.
```

---

### 11. Ikona: Office (Do kanclu)

**Soubor:** `type-office.png`  
**Koncept:** Maskot v kancelářském / pracovním kontextu – formální, profesionální prostředí (ne „účes do kanclu“).

**Prompt (CZ):**

```
Ilustrace pro mobilní aplikaci. Firemní maskot [JMÉNO / POPIS MASKOTA] v kancelářském kontextu: např. v košili nebo s kravatou, u pracovního stolu, s dokumentem nebo laptopem. Profesionální, formální situace. Žádné nůžky ani barber kontext. Výraz seriózní, profesionální. Obecná ikona pro volbu „Office“.

Formát: čtverec 1:1. Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, konzistentní s firemním maskotem. Pozadí: průhledné (transparent), export PNG s alfa kanálem.
```

**Prompt (EN):**

```
Mobile app illustration. Brand mascot [MASCOT NAME] in office context: e.g. in shirt or tie, at a desk, with document or laptop. Professional, formal situation. No scissors or barber context. Serious, professional expression. Generic icon for “Office” option.

Format: square 1:1. Style: modern, semi-realistic look – not cartoon or drawn. Clean lines, consistent with the brand mascot. Background: transparent, export PNG with alpha channel.
```

---

### 12. Ikona: Sporty (Sportovní)

**Soubor:** `type-sporty.png`  
**Koncept:** Maskot ve sportovním kontextu – dynamika, sport, pohyb (ne „sportovní účes“).

**Prompt (CZ):**

```
Ilustrace pro mobilní aplikaci. Firemní maskot [JMÉNO / POPIS MASKOTA] ve sportovním kontextu: např. dynamický postoj, s míčem nebo sportovním doplňkem, v pohybu. Sportovní nálada, energie. Žádné nůžky ani barber kontext. Výraz aktivní, energický. Obecná ikona pro volbu „Sporty“.

Formát: čtverec 1:1. Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, konzistentní s firemním maskotem. Pozadí: průhledné (transparent), export PNG s alfa kanálem.
```

**Prompt (EN):**

```
Mobile app illustration. Brand mascot [MASCOT NAME] in sport context: e.g. dynamic pose, with ball or sports accessory, in motion. Sporty vibe, energy. No scissors or barber context. Active, energetic expression. Generic icon for “Sporty” option.

Format: square 1:1. Style: modern, semi-realistic look – not cartoon or drawn. Clean lines, consistent with the brand mascot. Background: transparent, export PNG with alpha channel.
```

---

### 13. Ikona: Modern (Moderní)

**Soubor:** `type-modern.png`  
**Koncept:** Maskot v moderním / trendy kontextu – současný styl, sebevědomí (ne doslovně „moderní účes“).

**Prompt (CZ):**

```
Ilustrace pro mobilní aplikaci. Firemní maskot [JMÉNO / POPIS MASKOTA] v moderním kontextu: sebevědomý postoj, současný styl, trendy nálada. Žádné nůžky ani barber kontext. Výraz moderní, stylový. Obecná ikona pro volbu „Modern“.

Formát: čtverec 1:1. Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, konzistentní s firemním maskotem. Pozadí: průhledné (transparent), export PNG s alfa kanálem.
```

**Prompt (EN):**

```
Mobile app illustration. Brand mascot [MASCOT NAME] in modern context: confident pose, current style, trendy vibe. No scissors or barber context. Modern, stylish expression. Generic icon for “Modern” option.

Format: square 1:1. Style: modern, semi-realistic look – not cartoon or drawn. Clean lines, consistent with the brand mascot. Background: transparent, export PNG with alpha channel.
```

---

### 14. Ikona: Retro

**Soubor:** `type-retro.png`  
**Koncept:** Maskot v retro / vintage kontextu – starý styl, nostalgie (ne doslovně „retro účes“).

**Prompt (CZ):**

```
Ilustrace pro mobilní aplikaci. Firemní maskot [JMÉNO / POPIS MASKOTA] v retro / vintage kontextu: např. styl minulých desetiletí, klasická nálada, nostalgie. Žádné nůžky ani barber kontext. Výraz nostalgický, stylový. Obecná ikona pro volbu „Retro“.

Formát: čtverec 1:1. Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, konzistentní s firemním maskotem. Pozadí: průhledné (transparent), export PNG s alfa kanálem.
```

**Prompt (EN):**

```
Mobile app illustration. Brand mascot [MASCOT NAME] in retro / vintage context: e.g. style from past decades, classic vibe, nostalgia. No scissors or barber context. Nostalgic, stylish expression. Generic icon for “Retro” option.

Format: square 1:1. Style: modern, semi-realistic look – not cartoon or drawn. Clean lines, consistent with the brand mascot. Background: transparent, export PNG with alpha channel.
```

---

### 15. Ikona: Casual (Pod pantoflák / Casual)

**Soubor:** `type-casual.png`  
**Koncept:** Maskot v uvolněném / casual kontextu – pohodová situace, doma, všední den (ne „casual účes“).

**Prompt (CZ):**

```
Ilustrace pro mobilní aplikaci. Firemní maskot [JMÉNO / POPIS MASKOTA] v uvolněném kontextu: pohodový postoj, casual oblečení, domácí nebo všední nálada. Žádné nůžky ani barber kontext. Výraz pohodový, přirozený. Obecná ikona pro volbu „Casual“.

Formát: čtverec 1:1. Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, konzistentní s firemním maskotem. Pozadí: průhledné (transparent), export PNG s alfa kanálem.
```

**Prompt (EN):**

```
Mobile app illustration. Brand mascot [MASCOT NAME] in casual context: relaxed pose, casual clothing, home or everyday vibe. No scissors or barber context. Laid-back, natural expression. Generic icon for “Casual” option.

Format: square 1:1. Style: modern, semi-realistic look – not cartoon or drawn. Clean lines, consistent with the brand mascot. Background: transparent, export PNG with alpha channel.
```

---

### 16. Ikona: Summer (Léto)

**Soubor:** `season-summer.png`  
**Koncept:** Maskot v letním kontextu – slunce, teplo, léto (ne „účes na léto“).

**Prompt (CZ):**

```
Ilustrace pro mobilní aplikaci. Firemní maskot [JMÉNO / POPIS MASKOTA] v letním kontextu: letní nálada, slunce, teplo, svěžest. Volitelně sluneční brýle nebo letní doplněk. Žádné nůžky ani barber kontext. Výraz svěží, letní. Obecná ikona pro volbu „Summer“.

Formát: čtverec 1:1. Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, konzistentní s firemním maskotem. Pozadí: průhledné (transparent), export PNG s alfa kanálem.
```

**Prompt (EN):**

```
Mobile app illustration. Brand mascot [MASCOT NAME] in summer context: summer vibe, sun, warmth, freshness. Optional sunglasses or summer accessory. No scissors or barber context. Fresh, summery expression. Generic icon for “Summer” option.

Format: square 1:1. Style: modern, semi-realistic look – not cartoon or drawn. Clean lines, consistent with the brand mascot. Background: transparent, export PNG with alpha channel.
```

---

### 17. Ikona: Winter (Zima)

**Soubor:** `season-winter.png`  
**Koncept:** Maskot v zimním kontextu – zima, chlad, útulno (ne „účes na zimu“).

**Prompt (CZ):**

```
Ilustrace pro mobilní aplikaci. Firemní maskot [JMÉNO / POPIS MASKOTA] v zimním kontextu: zimní nálada, chlad, útulno. Volitelně čepice, šála nebo sněhová vločka. Žádné nůžky ani barber kontext. Výraz útulný, zimní. Obecná ikona pro volbu „Winter“.

Formát: čtverec 1:1. Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, konzistentní s firemním maskotem. Pozadí: průhledné (transparent), export PNG s alfa kanálem.
```

**Prompt (EN):**

```
Mobile app illustration. Brand mascot [MASCOT NAME] in winter context: winter vibe, cold, cozy. Optional hat, scarf or snowflake. No scissors or barber context. Cozy, winter expression.

Format: square 1:1. Style: modern, semi-realistic look – not cartoon or drawn. Clean lines, consistent with the brand mascot. Background: transparent, export PNG with alpha channel.
```

---

### 18. Ikona: All-year (Celoročně)

**Soubor:** `season-all-year.png`  
**Koncept:** Maskot s konceptem „celý rok / univerzální“ – kalendář, všechny roční období (ne „účes na celý rok“).

**Prompt (CZ):**

```
Ilustrace pro mobilní aplikaci. Firemní maskot [JMÉNO / POPIS MASKOTA] s konceptem „celý rok / univerzální“: např. s kalendářem, gesto „všude / vždy“, nebo symbol všech ročních období. Žádné nůžky ani barber kontext. Výraz univerzální, spokojený. Obecná ikona pro volbu „All-year“.

Formát: čtverec 1:1. Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, konzistentní s firemním maskotem. Pozadí: průhledné (transparent), export PNG s alfa kanálem.
```

**Prompt (EN):**

```
Mobile app illustration. Brand mascot [MASCOT NAME] with “all-year / universal” concept: e.g. with calendar, “everywhere / always” gesture, or symbol of all seasons. No scissors or barber context. Universal, satisfied expression.

Format: square 1:1. Style: modern, semi-realistic look – not cartoon or drawn. Clean lines, consistent with the brand mascot. Background: transparent, export PNG with alpha channel.
```

---

## Fullscreen obrázky pro návod „K čemu to je?“ (Moje účesy)

**Přesnější prompty podle logiky sekce Moje účesy** (ukládání nápadů, ukázka holiči, osobní galerie) jsou v samostatném dokumentu: **[docs/PROMPTY_NAVOD_MOJE_UCESY.md](PROMPTY_NAVOD_MOJE_UCESY.md)**. Níže zůstávají původní znění pro referenci.

Na obrazovce **Moje účesy** je odkaz „K čemu to je?“ – po kliknutí se zobrazí **3 fullscreen obrázky** (kroky návodu). Uživatel na každém kroku klikne na tlačítko dole a přejde na další; na třetím kroku návod končí.

**Specifikace obrázků:**  
- **Rozměr:** 1080×1920 px (poměr 9:16, portrét).  
- **Formát:** JPG (fotka/ilustrace) nebo PNG (hodně textu v obrázku).  
- **Důležitý obsah** v horních cca 70–80 %; spodních 15–20 % může být rezerva pro tlačítko v aplikaci.  
- **Styl:** Stejný jako ostatní prompty – maskot, moderní semi-realistický vzhled, konzistentní s firemním maskotem. Pozadí může být ilustrované (ne průhledné – jde o fullscreen scénu).

---

### Fullscreen 1: Nápad na účes (krok 1)

**Soubor:** `guide-step-1.jpg` (nebo `.png`)  
**Obsah:** Uživatel má nápad na účes → vytvoří si ho, pojmenuje, uloží.

**Prompt (CZ):**

```
Fullscreen ilustrace pro mobilní aplikaci kadeřnictví, poměr 9:16 (portrét), 1080×1920 px. Firemní maskot [JMÉNO / POPIS MASKOTA] v centru scény představuje „nápad na účes“: vymýšlí si účes, má bublinu s nápadem nebo náčrtem, případně si prohlíží v zrcadle představu. Výraz kreativní, soustředěný. Kolem něj může být naznačený mobil nebo zápisník s názvem účesu. Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, profesionální dojem, konzistentní s firemním maskotem. Pozadí jednoduché, nepřetěžující – jemný gradient nebo minimální prostředí. Důležitý obsah v horních 75 % obrázku; dole ponechat volnější prostor. Formát 1080×1920 px, 9:16.
```

**Prompt (EN):**

```
Fullscreen illustration for a barbershop mobile app, 9:16 portrait aspect ratio, 1080×1920 px. Brand mascot [MASCOT NAME] in the center representing “haircut idea”: imagining a haircut, with a thought bubble or sketch, or looking in a mirror at an idea. Creative, focused expression. Optional: phone or notepad with haircut name nearby. Style: modern, semi-realistic look – not cartoon or drawn. Clean lines, professional feel, consistent with the brand mascot. Simple, uncluttered background – soft gradient or minimal setting. Keep important content in the top 75% of the image; leave space at the bottom. Output 1080×1920 px, 9:16.
```

---

### Fullscreen 2: Uložení a ukázka holici (krok 2)

**Soubor:** `guide-step-2.jpg` (nebo `.png`)  
**Obsah:** Uložený účes si uživatel ukáže na pobočce holici – holic přesně ví, co chce.

**Před generováním:** Nahrajte jako referenční obrázek **vlastní reálnou fotku interiéru vašeho kadeřnictví/barbershopu**. Prostředí (pozadí, křeslo, výzdoba) má vycházet z této fotky, aby scéna vypadala jako váš skutečný barbershop.

**Prompt (CZ):**

```
Fullscreen ilustrace pro mobilní aplikaci kadeřnictví, poměr 9:16 (portrét), 1080×1920 px. Prostředí a interiér kadeřnictví: použij přiloženou referenční fotku našeho reálného interiéru barbershopu – pozadí, křeslo, výzdoba a atmosféra mají odpovídat této fotce (náš skutečný barbershop). V scéně je JEN firemní maskot [JMÉNO / POPIS MASKOTA] – žádný holic ani jiná postava. Maskot představuje klienta na pobočce: ukazuje do kamery/mě směrem displej mobilu s uloženým účesem (název, fotka nebo karta účesu), jako by chtěl někomu ukázat svůj účes. Výraz spokojený, jasný. Pouze maskot v interiéru z referenční fotky. Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, konzistentní s firemním maskotem. Důležitý obsah v horních 75 %; dole volnější prostor. Formát 1080×1920 px, 9:16.
```

**Prompt (EN):**

```
Fullscreen illustration for a barbershop mobile app, 9:16 portrait, 1080×1920 px. Environment and interior: use the attached reference photo of our real barbershop interior – background, chair, décor and atmosphere must match this photo (our actual barbershop). In the scene there is ONLY the brand mascot [MASCOT NAME] – no barber, no other character. The mascot as the client at the branch: showing toward camera/us the phone screen with a saved haircut (name, photo or haircut card), as if showing someone their haircut. Satisfied, clear expression. Only the mascot in the interior from the reference photo. Style: modern, semi-realistic look – not cartoon or drawn. Clean lines, consistent with the brand mascot. Important content in top 75%; leave space at bottom. Output 1080×1920 px, 9:16.
```

---

### Fullscreen 3: Hotovo – přehled účesů (krok 3)

**Soubor:** `guide-step-3.jpg` (nebo `.png`)  
**Obsah:** Přehled uložených účesů; klient má vše na jednom místě a může kdykoli přidat nebo ukázat.

**Důležité:** Na obrázku má být **pouze mobil nebo tablet reálných velikostí** (smartphone v ruce, nebo malý tablet) – ne velká tabule, ne obří displej, ne plakát. Zařízení v měřítku odpovídající držení v ruce.

**Prompt (CZ):**

```
Fullscreen ilustrace pro mobilní aplikaci kadeřnictví, poměr 9:16 (portrét), 1080×1920 px. Firemní maskot [JMÉNO / POPIS MASKOTA] spokojeně představuje „přehled svých účesů“: drží v ruce mobil nebo tablet REÁLNÉ VELIKOSTI (smartphone cca 15 cm, nebo malý tablet) – ne tabuli, ne velký displej, ne plakát. Na obrazovce zařízení je vidět několik karet/účesů (název, fotka). Zařízení v realistickém měřítku vzhledem k postavě. Výraz „mám to pod kontrolou“, spokojený. Volitelně ikona zaškrtnutí nebo palec nahoru. Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, konzistentní s firemním maskotem. Pozadí jednoduché. Důležitý obsah v horních 75 %; dole volnější prostor. Formát 1080×1920 px, 9:16.
```

**Prompt (EN):**

```
Fullscreen illustration for a barbershop mobile app, 9:16 portrait, 1080×1920 px. Brand mascot [MASCOT NAME] happily presenting “overview of my haircuts”: holding in hand a phone or tablet of REALISTIC SIZE (smartphone ~6 inches, or small tablet) – not a large board, not a big display, not a poster. On the device screen show several haircut cards (name, photo). Device in realistic scale relative to the character. Expression “I have it under control”, satisfied. Optional checkmark or thumbs up. Style: modern, semi-realistic look – not cartoon or drawn. Clean lines, consistent with the brand mascot. Simple background. Important content in top 75%; leave space at bottom. Output 1080×1920 px, 9:16.
```

---

## Volitelně: další kroky wizardu (bez promptů)

Pro úplnost – další kroky v wizardu, kde by šly doplnit ikony později (návrh činnosti pro maskota):

| Krok | Návrh činnosti pro maskota |
|------|----------------------------|
| Základní údaje o účesu | Maskot s pravítkem u vlasů nebo nastavuje čísla (délka, týdny). |
| Co k účesu patří? (amenity) | Maskot obklopen tagy / štítky nebo vybírá z „amenit“. |
| Přidej fotky účesu | Maskot drží foťák nebo mobil a fotí / prohlíží fotky. |
| Teď pojmenuj svůj účes | Maskot píše název na papír nebo do mobilu. |
| Náročnost stylingu a stylista | Maskot u zrcadla se stylingem nebo s postavou stylisty. |

---

## Kde v projektu používáme jaké ikony/obrázky

Přehled **souborů** a **míst v kódu**, kde se používají – abyste věděli, které ikony nahradit a kde se zobrazují.

### Ikony flow „Přidat účes“ (máte pro ně prompty výše)

| Soubor obrázku   | Kde se používá v kódu |
|------------------|------------------------|
| `assets/img/myidea.png`     | `app/screens/add-property-start.tsx` (krok 1), `app/(tabs)/(home)/my-haircuts.tsx` (karta „Vytvoř si účes“) |
| `assets/img/myrules.png`    | `app/screens/add-property-start.tsx` (krok 2), `app/(tabs)/(home)/my-haircuts.tsx` (karta „Dej pravidla“) |
| `assets/img/savefinish.png` | `app/screens/add-property-start.tsx` (krok 3), `app/(tabs)/(home)/my-haircuts.tsx` (karta „Finishujeme“) |
| `assets/img/gratulations.png` | `app/screens/add-property.tsx` (stránka Congratulations po dokončení) |

### Tab bar – dolní navigace (vhodné nahradit jednotným stylem s maskotem)

| Soubor obrázku   | Kde se používá | Popis |
|------------------|----------------|-------|
| `assets/img/wallet.png`      | `components/HomeTabs.tsx` | Tab: **Wallet** |
| `assets/img/my-haircuts.png` | `components/HomeTabs.tsx` | Tab: **My haircuts** |
| `assets/img/branches.png`    | `components/HomeTabs.tsx` | Tab: **Branches** |
| `assets/img/guides.png`      | `components/HomeTabs.tsx` | Tab: **Guides** |
| `assets/img/barbers.png`     | `components/HomeTabs.tsx` | Tab: **Barbers** |
| `assets/img/services.png`    | `components/HomeTabs.tsx` | Tab: **Services** |
| `assets/img/products.png`    | `components/HomeTabs.tsx` | Tab: **Products** |

Tedy **7 obrázků** v tab baru – všechny lze nahradit ilustracemi s maskotem ve stejném stylu jako flow „Přidat účes“.

### Ostatní obrázky (spíš placeholdery / obsah, ne nutně maskot)

- **room-1.avif … room-6.avif** – služby, produkty, rezervace, listingy, detaily (placeholder, když není vlastní obrázek). Použití: `services.tsx`, `experience.tsx`, `products.tsx`, `schedule.tsx`, `branch-detail.tsx`, `order-detail.tsx`, `add-property.tsx`, `listings.tsx`, `index.tsx`, `trip-detail.tsx`, `haircut-detail.tsx`, `favorites.tsx`, `service-detail.tsx`, `barber-detail.tsx`.
- **user-2.jpg, user-3.jpg, user-4.jpg, thomino.jpg** – avatary (profil, checkout, product-detail, booking-detail, dashboard). Použití: `profile.tsx`, `checkout.tsx`, `product-detail.tsx`, `booking-detail.tsx`, `dashboard.tsx`.
- **wallet/realbarber.png, wallet/RB.avatar.jpg** – transakce / Real Barber v peněžence. Použití: `wallet.tsx`, `wallet-history.tsx`, `transfer-select-recipient.tsx`, `TransactionDetailModal.tsx`, `rbc/historie.tsx`, `service-detail.tsx`, `barber-detail.tsx`, `branch-detail.tsx`.
- **markers/*.png** – mapové značky poboček (Hagibor, Kačerov, Modřany, Barrandov). Použití: `map.tsx`, `branch-detail.tsx`.
- **branches/*.jpg** – fotky poboček. Použití: `trip-detail.tsx`.

Tyto nemusíte měnit na maskot – jen pokud chcete jednotný vizuál i tam.

---

## 5.–7. Ikony pro tab bar (návrhy promptů)

Níže jsou návrhy pro **ikony v dolní navigaci**. Stejný formát a styl jako u ikon 1–4. Ikony se zobrazují malé (45×45 px), kompozice musí být **jednoduchá a čitelná**. Pro záložky Wallet / Moje střihy / Pobočky / Guides jsou **4 varianty** (lze generovat jako jeden společný motiv nebo 4 samostatné ikony); pro Barbers a Products **2 varianty**; pro Services **1 motiv** (znázornění nabídky).

**Velikost:** 45×45 px (tab bar). Export: **45×45 px** nebo 90×90 px (2× Retina), čtverec PNG.  
**Použití:** `components/HomeTabs.tsx`.

---

### 5. Ikony pro tab: Wallet, My haircuts, Branches, Guides

**Soubor(y):** `wallet.png`, `my-haircuts.png`, `branches.png`, `guides.png` (každá záložka má vlastní ikonu).

#### 5a Peněženka (Wallet)

**Prompt (CZ):**

```
Ikona pro záložku Peněženka. Firemní maskot [JMÉNO / POPIS MASKOTA] stojí v centru, v jedné ruce drží peněženku (otevřenou nebo zavřenou). Kolem maskota jsou znázorněny peníze – mince, bankovky nebo symboly peněz (např. plovoucí kolem postavy, decentně, ne přeplněno). Výraz spokojený, klidný. Hlavní motiv: maskot + peněženka v ruce + peníze kolem. Žádné složité pozadí. Kompozice čitelná v malé velikosti 45×45 px.

Technické: čtverec 1:1 (export 512×512 nebo 1024×1024 px, finálně 45×45 nebo 90×90 px). Styl semi-realistický, moderní – ne cartoon. Čisté linie, konzistentní s firemním maskotem. Pozadí průhledné (PNG s alfa kanálem).
```

**Prompt (EN):**

```
Tab icon for Wallet. Brand mascot [MASCOT NAME] in the center, holding a wallet in one hand (open or closed). Around the mascot, money is suggested – coins, banknotes or money symbols (e.g. floating gently around the figure, subtle, not cluttered). Expression: content, calm. Main motif: mascot + wallet in hand + money around. No complex background. Composition readable at small size 45×45 px.

Technical: square 1:1 (export 512×512 or 1024×1024 px, final 45×45 or 90×90 px). Semi-realistic, modern style – not cartoon. Clean lines, consistent with brand mascot. Transparent background (PNG with alpha channel).
```

---

#### 5b Moje střihy (My haircuts)

**Prompt (CZ):**

```
Ikona pro záložku Moje střihy. Firemní maskot [JMÉNO / POPIS MASKOTA] je šťastný, spokojený – úsměv, pozitivní výraz. Kolem něj „běhají“ nebo plují jeho myšlenkové bubliny s účesy: v bublinách jsou malé náznaky různých účesů (krátký, delší, s vousy, styling atd.), jako by si prohlížel své nápady. Maskot v centru, bubliny s účesy kolem. Žádné složité pozadí. Kompozice čitelná v 45×45 px.

Technické: čtverec 1:1 (export 512×512 nebo 1024×1024 px, finálně 45×45 nebo 90×90 px). Styl semi-realistický, moderní – ne cartoon. Čisté linie, konzistentní s firemním maskotem. Pozadí průhledné (PNG s alfa kanálem).
```

**Prompt (EN):**

```
Tab icon for My haircuts. Brand mascot [MASCOT NAME] looks happy, content – smile, positive expression. Around him, his thought bubbles "run" or float with hairstyles: inside the bubbles, small hints of different haircuts (short, longer, with beard, styling, etc.), as if browsing his ideas. Mascot in center, hairstyle bubbles around. No complex background. Composition readable at 45×45 px.

Technical: square 1:1 (export 512×512 or 1024×1024 px, final 45×45 or 90×90 px). Semi-realistic, modern style – not cartoon. Clean lines, consistent with brand mascot. Transparent background (PNG with alpha channel).
```

---

#### 5c Pobočky (Branches)

**Prompt (CZ):**

```
Ikona pro záložku Pobočky. Firemní maskot [JMÉNO / POPIS MASKOTA] v souvislosti s mapou: například stojí vedle malé mapy nebo schematické mapky (znázornění poboček / lokací), nebo drží mapu v ruce, nebo na mapě ukazuje. Motiv „kde nás najdeš“ – mapa jako hlavní symbol, maskot u ní. Jednoduchá, čitelná kompozice pro 45×45 px.

Technické: čtverec 1:1 (export 512×512 nebo 1024×1024 px, finálně 45×45 nebo 90×90 px). Styl semi-realistický, moderní – ne cartoon. Čisté linie, konzistentní s firemním maskotem. Pozadí průhledné (PNG s alfa kanálem).
```

**Prompt (EN):**

```
Tab icon for Branches. Brand mascot [MASCOT NAME] in connection with a map: e.g. standing next to a small map or schematic map (showing branches / locations), or holding a map, or pointing at the map. Motif "where to find us" – map as main symbol, mascot with it. Simple, readable composition for 45×45 px.

Technical: square 1:1 (export 512×512 or 1024×1024 px, final 45×45 or 90×90 px). Semi-realistic, modern style – not cartoon. Clean lines, consistent with brand mascot. Transparent background (PNG with alpha channel).
```

---

#### 5d Průvodce (Guides)

**Prompt (CZ):**

```
Ikona pro záložku Průvodce. Firemní maskot [JMÉNO / POPIS MASKOTA] v roli průvodce: přívětivý postoj, může lehce ukazovat nebo mít u sebe symbol „průvodce“ (např. malá kniha, seznam tipů, nebo kompas). Výraz vstřícný, „jdu ti poradit“. Jednoduchá kompozice, čitelná v 45×45 px.

Technické: čtverec 1:1, semi-realistický styl, průhledné pozadí (PNG s alfa kanálem).
```

**Prompt (EN):**

```
Tab icon for Guides. Brand mascot [MASCOT NAME] in a guide role: friendly pose, may gesture slightly or have a "guide" symbol (e.g. small book, list of tips, or compass). Expression welcoming, "here to help". Simple composition, readable at 45×45 px.

Technical: square 1:1, semi-realistic style, transparent background (PNG with alpha channel).
```

---

### 6. Ikony pro tab: Barbers, Products

**Soubor(y):** `barbers.png`, `products.png` (každá záložka má vlastní ikonu).

#### 6a Barbeři (Barbers)

**Důležité pro čtvercovou ikonu:** Kompozice musí **vyplňovat celý čtverec** – postavy velké v záběru, minimum prázdného okolí, aby ikona vizuálně „vážila“ stejně jako ostatní tab ikony (ne malá skupinka uprostřed prázdného pole).

**Prompt (CZ):**

```
Ikona pro záložku Barbeři – **čtvercový formát 1:1, kompozice musí vyplnit celý čtverec**. Na obrázku je více stejných firemních maskotů [JMÉNO / POPIS MASKOTA] vedle sebe v řadě (např. 2–3 maskoti). Postavy jsou **velké v záběru**, zabírají většinu plochy ikony – těsný výřez, žádné velké prázdné okraje kolem skupiny. Jako by foto „nařezané“ tak, že řada holiců vyplňuje čtverec od okraje k okraji (nebo téměř). Jednotný vizuální styl, všichni stejný maskot, přátelský/profesionální dojem. Průhledné pozadí. Výsledek musí mít stejnou vizuální „sílu“ jako ostatní tab ikony – ne malé postavy uprostřed prázdného čtverce.

Technické: čtverec 1:1 (export 512×512 nebo 1024×1024 px, finálně 45×45 nebo 90×90 px). Styl semi-realistický, moderní – ne cartoon. Pozadí průhledné (PNG s alfa kanálem).
```

**Prompt (EN):**

```
Tab icon for Barbers – **square format 1:1, composition must fill the entire square**. Multiple identical brand mascots [MASCOT NAME] side by side in a row (e.g. 2–3 mascots). Figures are **large in frame**, occupying most of the icon area – tight crop, no large empty margins around the group. As if the image is cropped so the row of barbers fills the square edge to edge (or nearly). Consistent visual style, same mascot repeated, friendly/professional feel. Transparent background. The result must have the same visual weight as other tab icons – not small figures in the middle of an empty square.

Technical: square 1:1 (export 512×512 or 1024×1024 px, final 45×45 or 90×90 px). Semi-realistic, modern style – not cartoon. Transparent background (PNG with alpha channel).
```

---

#### 6b Produkty (Products)

**Poznámka:** Pro věrné znázornění produktů přiložte k promptu **referenční fotky**: 1) kolínská (cologne), 2) matná pasta (matte paste). Nástroj, který to umí, pak vykreslí maskota s těmito konkrétními předměty.

**Prompt (CZ):**

```
Ikona pro záložku Produkty. Firemní maskot [JMÉNO / POPIS MASKOTA] drží v **jedné ruce kolínskou** (flakon na kolínskou / cologne – viz referenční fotka) a ve **druhé ruce matnou pastu** (tubu nebo balení matné pasty – viz referenční fotka). Postoj profesionální, nabízející – jako by představoval produkty. Výraz vstřícný. Hlavní motiv: maskot + kolínská v jedné ruce + matná pasta ve druhé. Žádné složité pozadí. Kompozice čitelná v 45×45 px. Pokud máte referenční obrázky kolínské a pasty, přidejte je k promptu pro konzistentní vzhled.

Technické: čtverec 1:1 (export 512×512 nebo 1024×1024 px, finálně 45×45 nebo 90×90 px). Styl semi-realistický, moderní – ne cartoon. Pozadí průhledné (PNG s alfa kanálem).
```

**Prompt (EN):**

```
Tab icon for Products. Brand mascot [MASCOT NAME] holds **cologne in one hand** (cologne bottle / flacon – see reference photo) and **matte paste in the other hand** (tube or matte paste packaging – see reference photo). Professional, offering pose – as if presenting the products. Expression welcoming. Main motif: mascot + cologne in one hand + matte paste in the other. No complex background. Composition readable at 45×45 px. If you have reference images of the cologne and paste, add them to the prompt for consistent look.

Technical: square 1:1 (export 512×512 or 1024×1024 px, final 45×45 or 90×90 px). Semi-realistic, modern style – not cartoon. Transparent background (PNG with alpha channel).
```

---

### 7. Ikona tabu: Services – znázornění nabídky

**Soubor:** `services.png`

**Prompt (CZ):**

```
Ikona pro záložku Služby. Znázornění **nabídky služeb** – firemní maskot [JMÉNO / POPIS MASKOTA] v odborném, služebném postoji. Vedle nebo kolem něj jednoduchá vizualizace nabídky: seznam s odrážkami, menu, checklist nebo ikona „služby“ (např. lísteček s položkami). Žádné nástroje v ruce (žádné nůžky, strojek). Výraz: odborný, spolehlivý. Jednoduchá kompozice, čitelná v 45×45 px.

Technické: čtverec 1:1 (export 512×512 nebo 1024×1024 px, finálně 45×45 nebo 90×90 px). Styl semi-realistický, moderní – ne cartoon. Pozadí průhledné (PNG s alfa kanálem).
```

**Prompt (EN):**

```
Tab icon for Services. Representation of **service offer** – brand mascot [MASCOT NAME] in an expert, service-oriented pose. Next to or around him, simple visualization of an offer: list with bullet points, menu, checklist or "services" icon (e.g. note with items). No tools in hand (no scissors, trimmer). Expression: expert, reliable. Simple composition, readable at 45×45 px.

Technical: square 1:1 (export 512×512 or 1024×1024 px, final 45×45 or 90×90 px). Semi-realistic, modern style – not cartoon. Transparent background (PNG with alpha channel).
```

---


## Ikony pro nové flow: Vytvořit rezervaci + Přesunout rezervaci

Pro nové obrazovky rezervací (create + reschedule) můžete použít stejný mascot styl jako výše.

**Doporučená technická specifikace (stejná jako jinde):**
- čtverec 1:1
- PNG s průhledným pozadím (alpha)
- export 512×512 px (nebo 1024×1024 px) a pak zmenšit dle použití v UI
- moderní semi-realistický styl, ne cartoon

| # | Návrh souboru | Kde se hodí | Koncept |
|---|---------------|-------------|---------|
| 19 | `reservation-branch.png` | Vytvořit rezervaci: výběr pobočky | maskot + mapa/pin + výběr pobočky |
| 20 | `reservation-specialist.png` | Vytvořit rezervaci: výběr specialisty | maskot + profil specialisty |
| 21 | `reservation-service.png` | Vytvořit rezervaci: výběr služby | maskot + seznam služeb / checklist |
| 22 | `reservation-time.png` | Vytvořit rezervaci: datum a čas | maskot + kalendář + hodiny |
| 23 | `reservation-summary.png` | Vytvořit rezervaci: shrnutí | maskot + souhrnná karta + check |
| 24 | `reschedule-old-slot.png` | Přesunout rezervaci: současný termín | maskot + přeškrtnutý původní termín |
| 25 | `reschedule-new-slot.png` | Přesunout rezervaci: nový termín | maskot + nový kalendářní slot |
| 26 | `reschedule-confirm.png` | Přesunout rezervaci: potvrzení | maskot + potvrzeno / check + „okamžitě“ |

### 19. Ikona: Výběr pobočky (`reservation-branch.png`)
**Prompt (CZ):**
```
Ilustrace pro mobilní aplikaci. Firemní maskot [JMÉNO / POPIS MASKOTA] vybírá pobočku: drží mapu nebo ukazuje na mapový pin, případně stojí vedle stylizované mapy s označeným bodem. Koncept „vyber pobočku“. Výraz jistý, orientovaný.
Formát: čtverec 1:1. Styl: moderní, semi-realistický vzhled – ne cartoon. Čisté linie, konzistentní s maskotem. Pozadí transparentní, export PNG s alfa kanálem.
```
**Prompt (EN):**
```
Mobile app illustration. Brand mascot [MASCOT NAME] choosing a branch: holding a map or pointing to a map pin, optionally standing next to a stylized map with one highlighted location. Concept: “choose branch”. Confident, focused expression.
Format: square 1:1. Style: modern semi-realistic look, not cartoon. Clean lines, consistent with mascot. Transparent background, PNG with alpha channel.
```

### 20. Ikona: Výběr specialisty (`reservation-specialist.png`)
**Prompt (CZ):**
```
Ilustrace pro mobilní aplikaci. Firemní maskot [JMÉNO / POPIS MASKOTA] vybírá specialistu: vedle něj je profilová karta specialisty (avatar + jméno), případně barber křeslo jako jemný symbol. Koncept „vyber specialistu“. Výraz přátelský, rozhodný.
Formát: čtverec 1:1, moderní semi-realistický styl, transparentní PNG pozadí.
```
**Prompt (EN):**
```
Mobile app illustration. Brand mascot [MASCOT NAME] choosing a specialist: next to him is a specialist profile card (avatar + name), optionally with a subtle barber chair symbol. Concept: “choose specialist”. Friendly, decisive expression.
Format: square 1:1, modern semi-realistic style, transparent PNG background.
```

### 21. Ikona: Výběr služby (`reservation-service.png`)
**Prompt (CZ):**
```
Ilustrace pro mobilní aplikaci. Firemní maskot [JMÉNO / POPIS MASKOTA] vybírá službu ze seznamu: drží nebo ukazuje na checklist / seznam položek služeb. Koncept „vyber službu“. Žádné přeplněné pozadí.
Formát: čtverec 1:1. Styl: moderní semi-realistický, transparentní PNG.
```
**Prompt (EN):**
```
Mobile app illustration. Brand mascot [MASCOT NAME] selecting a service from a list: holding or pointing to a checklist / service list card. Concept: “choose service”. Keep background minimal.
Format: square 1:1. Style: modern semi-realistic, transparent PNG.
```

### 22. Ikona: Výběr data a času (`reservation-time.png`)
**Prompt (CZ):**
```
Ilustrace pro mobilní aplikaci. Firemní maskot [JMÉNO / POPIS MASKOTA] vybírá termín: v kompozici je kalendář + hodiny (nebo časový slot). Koncept „vyber datum a čas rezervace“. Výraz soustředěný, přehledný.
Formát: čtverec 1:1, moderní semi-realistický styl, transparentní PNG.
```
**Prompt (EN):**
```
Mobile app illustration. Brand mascot [MASCOT NAME] choosing appointment time: calendar + clock (or time slot) visible in composition. Concept: “pick booking date and time”. Focused, clear expression.
Format: square 1:1, modern semi-realistic style, transparent PNG.
```

### 23. Ikona: Shrnutí rezervace (`reservation-summary.png`)
**Prompt (CZ):**
```
Ilustrace pro mobilní aplikaci. Firemní maskot [JMÉNO / POPIS MASKOTA] kontroluje shrnutí rezervace: drží nebo ukazuje souhrnnou kartu s body (pobočka, specialista, služba, čas) a ikonou check. Koncept „zkontroluj a potvrď“. Výraz spokojený a jistý.
Formát: čtverec 1:1, moderní semi-realistický styl, transparentní PNG.
```
**Prompt (EN):**
```
Mobile app illustration. Brand mascot [MASCOT NAME] reviewing reservation summary: holding or pointing to a summary card (branch, specialist, service, time) with a check icon. Concept: “review and confirm”. Confident, satisfied expression.
Format: square 1:1, modern semi-realistic style, transparent PNG.
```

### 24. Ikona: Současný termín (`reschedule-old-slot.png`)
**Prompt (CZ):**
```
Ilustrace pro mobilní aplikaci. Firemní maskot [JMÉNO / POPIS MASKOTA] ukazuje původní termín, který se mění: karta s datem/časem je ztlumená a přeškrtnutá. Koncept „starý termín bude nahrazen“. Výraz neutrální, informativní.
Formát: čtverec 1:1, moderní semi-realistický styl, transparentní PNG.
```
**Prompt (EN):**
```
Mobile app illustration. Brand mascot [MASCOT NAME] showing the original slot being changed: date/time card is muted and crossed out. Concept: “old slot will be replaced”. Neutral, informative expression.
Format: square 1:1, modern semi-realistic style, transparent PNG.
```

### 25. Ikona: Nový termín (`reschedule-new-slot.png`)
**Prompt (CZ):**
```
Ilustrace pro mobilní aplikaci. Firemní maskot [JMÉNO / POPIS MASKOTA] vybírá nový termín: zvýrazněný kalendářní den a časový slot, čistá pozitivní kompozice. Koncept „nový termín rezervace“. Výraz rozhodný, pozitivní.
Formát: čtverec 1:1, moderní semi-realistický styl, transparentní PNG.
```
**Prompt (EN):**
```
Mobile app illustration. Brand mascot [MASCOT NAME] choosing a new slot: highlighted calendar day and time slot in a clean positive composition. Concept: “new reservation slot”. Decisive, positive expression.
Format: square 1:1, modern semi-realistic style, transparent PNG.
```

### 26. Ikona: Potvrdit přesunutí okamžitě (`reschedule-confirm.png`)
**Prompt (CZ):**
```
Ilustrace pro mobilní aplikaci. Firemní maskot [JMÉNO / POPIS MASKOTA] potvrzuje přesunutí rezervace okamžitě: vedle něj je potvrzovací check a jemný symbol rychlosti (např. malý blesk). Koncept „potvrdit přesunutí okamžitě“. Výraz jistý, finální.
Formát: čtverec 1:1, moderní semi-realistický styl, transparentní PNG.
```
**Prompt (EN):**
```
Mobile app illustration. Brand mascot [MASCOT NAME] confirming instant reschedule: confirmation check icon plus a subtle speed symbol (e.g. small lightning). Concept: “confirm reschedule now”. Confident final expression.
Format: square 1:1, modern semi-realistic style, transparent PNG.
```

---

---

## Shrnutí

- **4 ikony flow „Přidat účes“:** Vytvoř si účes (myidea), Dej pravidla (myrules), Finishujeme (savefinish), Gratulujeme (gratulations). Odpovídající soubory a místa v kódu jsou v tabulce výše.
- **11 ikon pro krok 2 wizardu** (What best describes your haircut? / For which season?): type-shorter.png … type-casual.png (8 ks), season-summer.png, season-winter.png, season-all-year.png (3 ks). Použití: `app/screens/add-property.tsx` – propertyTypeOptions, guestAccessOptions. Prompty v sekci „Ikony pro krok 2 wizardu“ (ikony 8–18).
- **Ikony tab baru:** 7 samostatných ikon – wallet.png, my-haircuts.png, branches.png, guides.png, barbers.png, services.png, products.png. Vše v `components/HomeTabs.tsx`. Prompty pro varianty 5a–5d (Wallet, Moje střihy, Pobočky, Průvodce), 6a–6b (Barbeři, Produkty) a 7 (Services) jsou v sekcích 5.–7. níže.
- V každém promptu je maskot hlavní postava a dělá konkrétní činnost dané sekce.
- Před generováním doplňte `[JMÉNO / POPIS MASKOTA]` a případně přidejte referenční obrázek maskota pro konzistenci.
- Ostatní obrázky (room-*, user-*, wallet/*, markers, branches) jsou v dokumentu vypsané pro přehled; nahrazení maskotem je volitelné.
