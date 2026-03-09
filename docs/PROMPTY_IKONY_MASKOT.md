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

Níže je kompletní přehled ikon/obrázků v projektu, které dávají smysl mít ve **stejném stylu** (s maskotem). Pro všechny položky 1–7 už v dokumentu máte hotové prompty.

| # | Soubor | Kde se používá | Poznámka |
|---|--------|----------------|----------|
| **1** | `assets/img/myidea.png` | Flow „Přidat účes“ krok 1, úvodní karta Moje účesy | Vytvoř si svůj účes |
| **2** | `assets/img/myrules.png` | Flow „Přidat účes“ krok 2, úvodní karta Moje účesy | Dej svému účesu pravidla |
| **3** | `assets/img/savefinish.png` | Flow „Přidat účes“ krok 3, úvodní karta Moje účesy | Finishujeme a ukládáme |
| **4** | `assets/img/gratulations.png` | Stránka Congratulations po dokončení wizardu | Gratulujeme |
| **5** | `assets/img/house.png` | Tab bar: Wallet, My haircuts, Branches, Guides | „Domov“ / přehled |
| **6** | `assets/img/experience.png` | Tab bar: Barbers, Products | Barbeři / Produkty |
| **7** | `assets/img/services.png` | Tab bar: Services | Služby |

### Požadované velikosti ikon (stejné jako na místech použití v appce)

Všechny ikony jsou v kódu zobrazené jako **čtverce**. Exportujte PNG ve velikosti podle tabulky (nebo 2× pro Retina). Velikosti odpovídají aktuálnímu použití v aplikaci.

| # | Soubor | Zobrazená velikost v aplikaci | Doporučený export (PNG čtverec) |
|---|--------|--------------------------------|----------------------------------|
| 1 | `myidea.png` | 64×64 px (kroky flow), 80×80 px (karta Moje účesy) | **80×80 px** (nebo 160×160 px pro 2× Retina) |
| 2 | `myrules.png` | 64×64 px (kroky flow), 80×80 px (karta Moje účesy) | **80×80 px** (nebo 160×160 px pro 2× Retina) |
| 3 | `savefinish.png` | 64×64 px (kroky flow), 80×80 px (karta Moje účesy) | **80×80 px** (nebo 160×160 px pro 2× Retina) |
| 4 | `gratulations.png` | 128×128 px (stránka Congratulations) | **128×128 px** (nebo 256×256 px pro 2× Retina) |
| 5 | `house.png` | 45×45 px (tab bar) | **45×45 px** (nebo 90×90 px pro 2× Retina) |
| 6 | `experience.png` | 45×45 px (tab bar) | **45×45 px** (nebo 90×90 px pro 2× Retina) |
| 7 | `services.png` | 45×45 px (tab bar) | **45×45 px** (nebo 90×90 px pro 2× Retina) |

*Pokud chcete jednu velikost pro všechny (např. 512×512 px), aplikace obrázky v kódu zmenší; důležité je zachovat poměr 1:1 (čtverec).*

**Celkem: 7 ikon** (úvod + tab bar). **+ 11 ikon pro krok 2 wizardu** (What best describes your haircut? / For which season?) – prompty v sekci „Ikony pro krok 2 wizardu“ (ikony 8–18). Vše ve stejném semi-realistickém stylu s maskotem a průhledným pozadím.

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
| `assets/img/house.png`      | `components/HomeTabs.tsx` | Tab: **Wallet**, **My haircuts**, **Branches**, **Guides** (4× stejná ikona) |
| `assets/img/experience.png` | `components/HomeTabs.tsx` | Tab: **Barbers**, **Products** (2× stejná ikona) |
| `assets/img/services.png`  | `components/HomeTabs.tsx` | Tab: **Services** (1×) |

Tedy **3 různé obrázky** v tab baru – všechny by šlo nahradit ilustracemi s maskotem ve stejném stylu jako flow „Přidat účes“.

### Ostatní obrázky (spíš placeholdery / obsah, ne nutně maskot)

- **room-1.avif … room-6.avif** – služby, produkty, rezervace, listingy, detaily (placeholder, když není vlastní obrázek). Použití: `services.tsx`, `experience.tsx`, `products.tsx`, `schedule.tsx`, `branch-detail.tsx`, `order-detail.tsx`, `add-property.tsx`, `listings.tsx`, `index.tsx`, `trip-detail.tsx`, `haircut-detail.tsx`, `favorites.tsx`, `service-detail.tsx`, `barber-detail.tsx`.
- **user-2.jpg, user-3.jpg, user-4.jpg, thomino.jpg** – avatary (profil, checkout, product-detail, booking-detail, dashboard). Použití: `profile.tsx`, `checkout.tsx`, `product-detail.tsx`, `booking-detail.tsx`, `dashboard.tsx`.
- **wallet/realbarber.png, wallet/RB.avatar.jpg** – transakce / Real Barber v peněžence. Použití: `wallet.tsx`, `wallet-history.tsx`, `transfer-select-recipient.tsx`, `TransactionDetailModal.tsx`, `rbc/historie.tsx`, `service-detail.tsx`, `barber-detail.tsx`, `branch-detail.tsx`.
- **markers/*.png** – mapové značky poboček (Hagibor, Kačerov, Modřany, Barrandov). Použití: `map.tsx`, `branch-detail.tsx`.
- **branches/*.jpg** – fotky poboček. Použití: `trip-detail.tsx`.

Tyto nemusíte měnit na maskot – jen pokud chcete jednotný vizuál i tam.

---

## 5.–7. Ikony pro tab bar (návrhy promptů)

Níže jsou návrhy pro **3 ikony v dolní navigaci**. Stejný formát a styl jako u ikon 1–4; každý prompt je samostatný.

### 5. Ikona tabu: Wallet / My haircuts / Branches / Guides („domov“ / přehled)

**Soubor:** `house.png`  
**Velikost:** 45×45 px (tab bar). Export: **45×45 px** nebo 90×90 px (2× Retina), čtverec PNG.  
**Použití:**  
`components/HomeTabs.tsx` – labely: Wallet, My haircuts, Branches, Guides.

**Prompt (CZ):**

```
Ilustrace pro mobilní aplikaci kadeřnictví, ikona pro záložku (Wallet / Moje účesy / Pobočky / Průvodce). Firemní maskot [JMÉNO / POPIS MASKOTA] v roli „domova“ nebo přehledu: například stojí v přívětivém postoji, má u sebe symbol domu nebo seznamu, nebo vítá zákazníka. Výraz přátelský, přehledový.

Formát: čtverec nebo 1:1, vhodné pro ikonu v UI (např. 512×512 px nebo 1024×1024). Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, profesionální dojem, konzistentní s firemním maskotem. Vyhněte se přehnaně animovanému nebo dětskému stylu. Pozadí: průhledné (transparent) – žádné barevné pozadí, export PNG s alfa kanálem, aby ikona vypadala dobře na jakémkoli pozadí v aplikaci. Čtvercový formát, vhodné jako ikona tabu v aplikaci. Jednotný vizuální styl značky.
```

**Prompt (EN):**

```
Mobile app illustration for a barbershop, icon for tab (Wallet / My haircuts / Branches / Guides). Brand mascot [MASCOT NAME] in a “home” or overview role: e.g. standing in a welcoming pose, with a house or list symbol, or welcoming the customer. Friendly, clear expression.

Format: square or 1:1, suitable for a UI icon (e.g. 512×512 or 1024×1024 px). Style: modern, semi-realistic look – not cartoon or drawn. Clean lines, professional feel, consistent with the brand mascot. Avoid overly animated or childish style. Background: transparent – no colored background, export PNG with alpha channel so the icon looks good on any app background. Square format, suitable as a tab icon in the app. Cohesive brand visual identity.
```

---

### 6. Ikona tabu: Barbers / Products

**Soubor:** `experience.png`  
**Velikost:** 45×45 px (tab bar). Export: **45×45 px** nebo 90×90 px (2× Retina), čtverec PNG.  
**Použití:**  
`components/HomeTabs.tsx` – labely: Barbers, Products.

**Prompt (CZ):**

```
Ilustrace pro mobilní aplikaci kadeřnictví, ikona pro záložku Barbeři / Produkty. Firemní maskot [JMÉNO / POPIS MASKOTA] v roli „zkušenosti“ nebo nabídky: například ukazuje na člověka (barbera) nebo na produkt (vosk, gel), nebo má vedle sebe nůžky a láhev přípravku. Výraz profesionální, nabízející.

Formát: čtverec nebo 1:1, vhodné pro ikonu v UI (např. 512×512 px nebo 1024×1024). Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, profesionální dojem, konzistentní s firemním maskotem. Vyhněte se přehnaně animovanému nebo dětskému stylu. Pozadí: průhledné (transparent) – žádné barevné pozadí, export PNG s alfa kanálem, aby ikona vypadala dobře na jakémkoli pozadí v aplikaci. Čtvercový formát, vhodné jako ikona tabu v aplikaci. Jednotný vizuální styl značky.
```

**Prompt (EN):**

```
Mobile app illustration for a barbershop, icon for tab Barbers / Products. Brand mascot [MASCOT NAME] in an “experience” or offering role: e.g. pointing at a person (barber) or a product (wax, gel), or with scissors and a product bottle beside him. Professional, offering expression.

Format: square or 1:1, suitable for a UI icon (e.g. 512×512 or 1024×1024 px). Style: modern, semi-realistic look – not cartoon or drawn. Clean lines, professional feel, consistent with the brand mascot. Avoid overly animated or childish style. Background: transparent – no colored background, export PNG with alpha channel so the icon looks good on any app background. Square format, suitable as a tab icon in the app. Cohesive brand visual identity.
```

---

### 7. Ikona tabu: Services

**Soubor:** `services.png`  
**Velikost:** 45×45 px (tab bar). Export: **45×45 px** nebo 90×90 px (2× Retina), čtverec PNG.  
**Použití:**  
`components/HomeTabs.tsx` – label: Services.

**Prompt (CZ):**

```
Ilustrace pro mobilní aplikaci kadeřnictví, ikona pro záložku Služby. Firemní maskot [JMÉNO / POPIS MASKOTA] v roli služeb: například drží nůžky nebo holicí strojek, nebo ukazuje na „menu“ služeb (stříhání, vousy, styling). Výraz odborný, služebný.

Formát: čtverec nebo 1:1, vhodné pro ikonu v UI (např. 512×512 px nebo 1024×1024). Styl: moderní, semi-realistický vzhled – ne kreslený ani cartoon. Čisté linie, profesionální dojem, konzistentní s firemním maskotem. Vyhněte se přehnaně animovanému nebo dětskému stylu. Pozadí: průhledné (transparent) – žádné barevné pozadí, export PNG s alfa kanálem, aby ikona vypadala dobře na jakémkoli pozadí v aplikaci. Čtvercový formát, vhodné jako ikona tabu v aplikaci. Jednotný vizuální styl značky.
```

**Prompt (EN):**

```
Mobile app illustration for a barbershop, icon for tab Services. Brand mascot [MASCOT NAME] in a services role: e.g. holding scissors or a trimmer, or pointing at a “menu” of services (haircut, beard, styling). Expert, service-oriented expression.

Format: square or 1:1, suitable for a UI icon (e.g. 512×512 or 1024×1024 px). Style: modern, semi-realistic look – not cartoon or drawn. Clean lines, professional feel, consistent with the brand mascot. Avoid overly animated or childish style. Background: transparent – no colored background, export PNG with alpha channel so the icon looks good on any app background. Square format, suitable as a tab icon in the app. Cohesive brand visual identity.
```

---

## Shrnutí

- **4 ikony flow „Přidat účes“:** Vytvoř si účes (myidea), Dej pravidla (myrules), Finishujeme (savefinish), Gratulujeme (gratulations). Odpovídající soubory a místa v kódu jsou v tabulce výše.
- **11 ikon pro krok 2 wizardu** (What best describes your haircut? / For which season?): type-shorter.png … type-casual.png (8 ks), season-summer.png, season-winter.png, season-all-year.png (3 ks). Použití: `app/screens/add-property.tsx` – propertyTypeOptions, guestAccessOptions. Prompty v sekci „Ikony pro krok 2 wizardu“ (ikony 8–18).
- **3 ikony tab baru:** house.png (Wallet / My haircuts / Branches / Guides), experience.png (Barbers / Products), services.png (Services). Vše v `components/HomeTabs.tsx`.
- V každém promptu je maskot hlavní postava a dělá konkrétní činnost dané sekce.
- Před generováním doplňte `[JMÉNO / POPIS MASKOTA]` a případně přidejte referenční obrázek maskota pro konzistenci.
- Ostatní obrázky (room-*, user-*, wallet/*, markers, branches) jsou v dokumentu vypsané pro přehled; nahrazení maskotem je volitelné.
