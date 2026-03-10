# Prompty pro návod „K čemu to je?“ (Moje účesy) – 3 fullscreen obrázky

Na obrazovce **Moje účesy** je odkaz „K čemu to je?“ – po kliknutí se zobrazí **3 fullscreen obrázky** (kroky návodu). Uživatel na každém kroku přejde na další; na třetím kroku tlačítko „Rozumím“ a návod končí.

---

## Logika sekce Moje účesy (co návod vysvětluje)

Sekce **Moje účesy** vám umožňuje ukládat si všechny účesy, které se vám líbí nebo které jste už někdy měli. Kdykoliv vás napadne nový styl – například z internetu, sociálních sítí nebo ze života – můžete si ho jednoduše uložit.

Ke každému účesu můžete přidat **fotky, vlastní název, popisek a kategorii**, díky čemuž budete mít své účesy přehledně uspořádané na jednom místě.

Tato funkce vám zároveň **výrazně usnadní komunikaci s holičem**. Když přijdete na pobočku, stačí otevřít sekci Moje účesy a ukázat konkrétní účes, který chcete. Holič díky fotkám přesně uvidí, o jaký styl jde, a může se podle toho lépe připravit. Celý proces je rychlejší, jednodušší a přesnější – nemusíte složitě vysvětlovat a holič přesně ví, jakého výsledku chcete dosáhnout.

**Moje účesy = vaše osobní galerie stylů, inspirací a účesů**, ke kterým se můžete kdykoliv vrátit nebo je rovnou probrat se svým holičem.

---

## Specifikace obrázků

| Požadavek | Hodnota |
|-----------|--------|
| **Rozměr** | **1080×1920 px** (poměr **9:16**, portrét) – aby fotka v aplikaci byla celá vidět |
| **Formát** | JPG nebo PNG |
| **Důležitý obsah** | V horních cca 75 %; spodní část volnější (v appce je přes ni text a tlačítko) |
| **Styl** | Maskot, moderní semi-realistický vzhled, konzistentní s firemním maskotem. Pozadí ilustrované (ne průhledné). |
| **Soubory** | `guide-step-1.jpg`, `guide-step-2.jpg`, `guide-step-3.jpg` → uložit do `assets/img/` |

**Před použitím:** Do promptu doplňte `[JMÉNO / POPIS MASKOTA]` (např. Real Barber panáček).

---

## Krok 1: Ukládání nápadů – zamýšlí se, kolem hlavy běhají nápady na účesy

**Soubor:** `guide-step-1.jpg` (nebo `.png`)  
**Smysl:** Ukládat si účesy, které se líbí nebo které už měl. Kdykoliv napadne nový styl – jednoduše uložit. Žádný telefon v záběru – maskot v stoje, zamýšlený, kolem hlavy mu „běhají“ nápady na účesy.

### Prompt (CZ)

```
Fullscreen ilustrace pro mobilní aplikaci kadeřnictví, poměr 9:16 (portrét), 1080×1920 px. Firemní maskot [JMÉNO / POPIS MASKOTA] stojí, je zamýšlený – přemýšlí. Kolem hlavy mu „běhají“ nebo plují nápady na účesy: myšlenkové bubliny nebo malé obrázky a náznaky různých účesů (krátký, delší, s vousy, styling, atd.) kolem hlavy, jako by mu v hlavě probíhaly inspirace. Žádný mobil ani telefon v ruce – jen postava v stoje, zamyšlená, kreativní. Výraz soustředěný, přemýšlivý. Pozadí jednoduché (doma, kavárna, nebo neutrální), ne kadeřnictví. Styl: moderní, semi-realistický – ne cartoon. Čisté linie, konzistentní s firemním maskotem. Důležitý obsah v horních 75 %; dole volnější prostor. Výstup 1080×1920 px, 9:16.
```

### Prompt (EN)

```
Fullscreen illustration for a barbershop mobile app, 9:16 portrait, 1080×1920 px. Brand mascot [MASCOT NAME] standing, thoughtful – lost in thought. Around their head "run" or float ideas for haircuts: thought bubbles or small images/hints of different hairstyles (short, longer, with beard, styling, etc.) around the head, as if inspirations are flowing through their mind. No phone or mobile in hand – just the character standing, reflective, creative. Expression focused, thoughtful. Simple background (home, café, or neutral), not a barbershop. Style: modern, semi-realistic – not cartoon. Clean lines, consistent with brand mascot. Important content in top 75%; leave space at bottom. Output 1080×1920 px, 9:16.
```

---

## Krok 2: Na pobočce – ukázat holiči uložený účes

**Soubor:** `guide-step-2.jpg` (nebo `.png`)  
**Smysl:** Komunikace s holičem je jednodušší. Na pobočce otevřít Moje účesy a ukázat konkrétní účes. Holič díky fotkám přesně vidí, o jaký styl jde – rychlejší, jednodušší a přesnější.

### Prompt (CZ)

```
Fullscreen ilustrace pro mobilní aplikaci kadeřnictví, poměr 9:16 (portrét), 1080×1920 px. Scéna na pobočce / v kadeřnictví: firemní maskot [JMÉNO / POPIS MASKOTA] v roli klienta drží mobil a ukazuje jeho displej směrem k divákovi (nebo do prostoru, kde stojí holič). Na displeji je vidět uložený účes – fotka účesu, název nebo karta z aplikace Moje účesy. Výraz klienta: spokojený, jasný – „tady je přesně ten účes, který chci“. V pozadí naznačený interiér kadeřnictví (křeslo, zrcadlo, náznak prostředí), ale hlavní postava je maskot-klient s mobilem. Žádná druhá postava (holič) v záběru nutná – důraz na „ukazuji svůj uložený účes“. Styl: moderní, semi-realistický – ne cartoon. Čisté linie, konzistentní s firemním maskotem. Důležitý obsah v horních 75 %; dole volnější prostor. Výstup 1080×1920 px, 9:16.
```

### Prompt (EN)

```
Fullscreen illustration for a barbershop mobile app, 9:16 portrait, 1080×1920 px. Scene at the branch / barbershop: brand mascot [MASCOT NAME] as the client holding a phone and showing its screen toward the viewer (or toward where the barber would be). On the screen a saved haircut is visible – haircut photo, name or app card from My haircuts. Client expression: satisfied, clear – "this is exactly the haircut I want". In the background suggest barbershop interior (chair, mirror, atmosphere), but the main focus is the mascot-client with the phone. No second character (barber) required in frame – emphasis on "showing my saved haircut". Style: modern, semi-realistic – not cartoon. Clean lines, consistent with brand mascot. Important content in top 75%; leave space at bottom. Output 1080×1920 px, 9:16.
```

---

## Krok 3: Osobní galerie – vše na jednom místě

**Soubor:** `guide-step-3.jpg` (nebo `.png`)  
**Smysl:** Moje účesy = osobní galerie stylů, inspirací a účesů. Můžete se kdykoliv vrátit nebo je probrat s holičem. Vše přehledně na jednom místě.

**Důležité:** Mobil/tablet v reálné velikosti (smartphone v ruce), ne obří displej ani plakát.

### Prompt (CZ)

```
Fullscreen ilustrace pro mobilní aplikaci kadeřnictví, poměr 9:16 (portrét), 1080×1920 px. Firemní maskot [JMÉNO / POPIS MASKOTA] spokojeně představuje „osobní galerii účesů“: drží v ruce mobil REÁLNÉ VELIKOSTI (smartphone), na jehož obrazovce je vidět přehled několika karet účesů (miniatury, názvy) – jako galerie / seznam „Moje účesy“. Výraz: mám vše na jednom místě, kdykoliv se můžu vrátit nebo ukázat holiči. Volitelně lehký úsměv nebo gesto spokojenosti. Pozadí jednoduché, nepřetěžující. Styl: moderní, semi-realistický – ne cartoon. Čisté linie, konzistentní s firemním maskotem. Důležitý obsah v horních 75 %; dole volnější prostor. Výstup 1080×1920 px, 9:16.
```

### Prompt (EN)

```
Fullscreen illustration for a barbershop mobile app, 9:16 portrait, 1080×1920 px. Brand mascot [MASCOT NAME] happily presenting "personal gallery of haircuts": holding a phone of REALISTIC SIZE (smartphone) whose screen shows an overview of several haircut cards (thumbnails, names) – like a gallery / list "My haircuts". Expression: everything in one place, can return anytime or show the barber. Optional slight smile or satisfied gesture. Simple, uncluttered background. Style: modern, semi-realistic – not cartoon. Clean lines, consistent with brand mascot. Important content in top 75%; leave space at bottom. Output 1080×1920 px, 9:16.
```

---

## Shrnutí

| Krok | Soubor | Téma |
|------|--------|------|
| 1 | `guide-step-1.jpg` | Ukládání nápadů – inspirace (internet/sítě), přidat fotku, název, popisek, kategorii |
| 2 | `guide-step-2.jpg` | Na pobočce – ukázat holiči displej s uloženým účesem |
| 3 | `guide-step-3.jpg` | Osobní galerie – přehled karet účesů na jednom místě |

Po vygenerování uložte soubory do **`assets/img/`** (název `guide-step-1.jpg`, `guide-step-2.jpg`, `guide-step-3.jpg`).
