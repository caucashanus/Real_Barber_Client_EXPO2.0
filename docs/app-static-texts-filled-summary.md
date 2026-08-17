# App static texts — filled summary

Dodávka pro mobilní app tým podle `app-static-texts-brief-for-web.md`.

## Numbers
- Rows: **1356**
- UK from web (exact CS match): **633**
- UK from web (exact EN match): **34**
- UK newly translated (no web match): **689**
- Empty UK: **0**
- `cs_web_suggested` filled: **5**
- `en_web_suggested` filled: **6**
- Placeholder warnings: **0**

## Files
- `app-static-texts-filled.csv` — filled table
- `app-static-texts-template.csv` — untouched original

## Method
1. Flatten web `messages/{cs,en,uk}.json`.
2. If app `cs` equals a web CS string → copy web `uk`.
3. Else if app `en` equals a web EN string → copy web `uk` (no auto CS suggestion).
4. Else Ukrainian translation for unmatched UI strings (web terminology: філія, бронювання, барбер, зачіски, послуга, відгук).
5. `cs_web_suggested` / `en_web_suggested` only for curated brand diffs (Inspirace→Účesy, Holič vs Kadeřník, …).

## Curated web alignment suggestions
- `tabInspirace`: Na webu je sekce Účesy / Hairstyles (app EN má Inspiration).
- `inspiracePageTitle`: Web používá Účesy/Hairstyles místo Inspirace/Inspiration.
- `inspiraceLoadError`: Sjednocení Inspirace → Účesy / Inspiration → Hairstyles.
- `inspiraceDetailBackToInspirace`: Sjednocení Inspirace → Účesy / Inspiration → Hairstyles.
- `servicesPageHaircutInspiration`: Web Home.seeHaircuts / katalog účesů.
- `bookingCalendarNoteBarber`: Na webu je „Holič“, ne „Kadeřník“.
- `accentTitle`: Web Accent.title = Barevnost / Colors (app EN: Accent color).
