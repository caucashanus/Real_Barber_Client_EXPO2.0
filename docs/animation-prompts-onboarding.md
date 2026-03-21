# Textové prompty – animace při prvním spuštění (onboarding)

Použití: zadej vybraný prompt do AI nástroje na generování **vektorové / Lottie** animace.  
Cíl: **3–4 samostatné soubory** (jedna animace = jeden krok onboardingu), styl **čistý, prémiový barbershop**, bez rušivých efektů.

---

## Společné zadání pro všechny prompty (přidej vždy na konec)

```
Výstup: vektorová animace vhodná pro Lottie (čisté tvary, žádné fotografie).
Pozadí: průhledné nebo jednoduchá plocha (aby šlo použít na světlém i tmavém tématu).
Bez textu v animaci (text řešíme v aplikaci).
Bez log a ochranných známek třetích stran.
Plynulá smyčka (seamless loop) nebo jeden krátký „dojezd“ na klidný stav – uvedi v návrhu.
Délka: 2–4 sekundy na cyklus.
Styl: minimalistický, moderní, profesionální barbershop / kadeřnictví, klidné barvy (černá, bílá, šedá, jemné zlaté nebo akcentová zelená jen jako detail).
```

---

## Krok 1 – „Vítej v Real Barber“

**CZ prompt:**

```
Minimalistická vektorová animace: jemně se rozevírající nebo pulzující symbol nůžek (barberské) a jednoduchý kontur obličeje nebo siluety hlavy v pozadí, velmi jemný pohyb. Pocit přivítání a profesionality. Žádný text. Průhledné pozadí. Plynulá smyčka.
```

**EN prompt (pro nástroje v angličtině):**

```
Minimal vector animation loop: subtle barber scissors icon with gentle breathing or opening motion, very faint silhouette of a head or face outline in the background. Premium barbershop feel, calm, professional. No text. Transparent background. Seamless loop, 2–4 seconds.
```

---

## Krok 2 – „Rezervace u mistra“

**CZ prompt:**

```
Vektorová animace: jednoduchý kalendář nebo ikona hodin spojená s konturou kadeřníka (silueta s nůžkami). Jemný pohyb ručiček hodin nebo přechodu mezi dvěma termíny. Připomíná rezervaci času bez chaosu. Bez textu, průhledné pozadí, plynulá smyčka, minimalistický styl.
```

**EN prompt:**

```
Vector loop animation: simple calendar or clock icon subtly combined with a minimalist barber silhouette. Gentle motion suggesting booking a time slot (clock hand, or soft highlight moving). No text, transparent background, seamless loop, premium flat style, black/white/grey with tiny accent.
```

---

## Krok 3 – „Oblíbené a přehled“

**CZ prompt:**

```
Vektorová animace: srdíčko nebo hvězda (oblíbené) a jemně se přeskupující nebo zapadající dlaždice / karty, které symbolizují přehled služeb a oblíbených míst. Plynulý, uklidňující pohyb. Bez textu, průhledné pozadí, smyčka, moderní UI estetika.
```

**EN prompt:**

```
Vector loop: favorite icon (heart or star) with soft floating tiles or cards arranging into a neat grid, suggesting favorites and overview. Calm, premium motion. No text, transparent background, seamless loop, minimal barbershop app UI style.
```

---

## Krok 4 (volitelný) – „Cesty a zkušenosti“

**CZ prompt:**

```
Vektorová animace: jednoduchá cesta nebo šipka vedoucí k „cíli“ (mapový pin nebo značka lokality), jemný pohyb vpřed. Symbolizuje „jak se k nám dostaneš“ nebo zážitek z návštěvy. Bez textu, průhledné pozadí, plynulá smyčka, minimalisticky.
```

**EN prompt:**

```
Vector loop: simple path or arrow leading to a location pin, gentle forward motion suggesting journey or directions to the salon. No text, transparent background, seamless loop, minimal style, premium travel/journey metaphor without clutter.
```

---

## Poznámky pro tvůrce

- Pokud AI vygeneruje **příliš přeplněnou** scénu, zúž prompt: *„only two elements, no background shapes, single accent color.“*
- Pro **tmavý režim** v aplikaci můžeš nechat animaci **čistě bílou / šedou** a barvu řešit přes `tint` v aplikaci jen pokud to nástroj a export umožní.
- Po exportu do **Lottie JSON** ověř velikost souboru; nad ~300–500 KB zvaž zjednodušení.

---

## Soubory v projektu (doporučené názvy)

| Krok | Název souboru (navrhovaný) |
|------|----------------------------|
| 1 | `onboarding-welcome.json` |
| 2 | `onboarding-booking.json` |
| 3 | `onboarding-favorites.json` |
| 4 | `onboarding-journey.json` (volitelné) |

Ulož do `assets/lottie/` a prompty drž v tomto souboru aktualizované, až bude finální verze.
