# CRM zadání: odstranění zákaznických článků, ponechat jen Staff návody

**Verze:** 2026-10-12  
**Platí místo:** `crm-zadani-clanky-bez-kanalu.md` (neimplementovat)  
**Kontext:** Web repozitář = jediný zdroj pravdy pro veřejné návody / blog / SEO. Mobilní app Návody dnes čtou `GET /api/client/guides`.

---

## Hlavní sdělení pro CRM (copy-paste)

Rozhodli jsme se, že **články (návody, novinky, blog) nebudou v CRM**. Veškerý obsah, URL, rubriky a SEO budeme vést v **repozitáři webu**.

CRM má **kompletně odstranit doménu zákaznických článků**: admin sekci **Články** (v současné podobě), datový model, media vázaná **jen** na tyto články, public API (`/api/public/articles`, legacy `/blog`, `/guides`) a **client endpointy pro guides** (`GET /api/client/guides` a související).

**V CRM zůstane pouze:** interní oblast **Staff návody** (obsah pro zaměstnance / barbery), oddělená od zákaznického CMS.

Před smazáním DB dodáte **jednorázový export** (JSON + média / URL) podle §4 níže (export už má web tým z app repa v `docs/crm-guides-articles-export.json` + `.md` — CRM export slouží jako oficiální potvrzení shody).

Po potvrzení webu **„obsah je v repu“** vypneme API (doporučeno **410 Gone** + hlavička **Sunset**) a smažete tabulky / model zákaznických článků.

Dokument `crm-zadani-clanky-bez-kanalu.md` (kanál, rubriky, `webUrl*` v CRM) se **dál neimplementuje** — nahrazuje ho tento dokument.

---

## 1. Rozsah odstranění (OUT of scope CRM)

| Oblast | Akce |
|--------|------|
| Admin UI „Články“ pro zákazníky | Odstranit nebo nahradit jen **Staff návody** |
| DB tabulky / vazby článků, rubrik, `webUrl*` pro zákazníky | Smazat po exportu a cutover |
| Media používaná **výhradně** u zákaznických článků | Archiv / smazat dle exportu; nesahat na media cuts, profily, pobočky, … |
| `GET /api/public/articles` | 410 Gone (+ Sunset) → později odstranit |
| Legacy public `/blog`, `/guides` | Stejně |
| **`GET /api/client/guides`** (mobilní app) | 410 Gone po cutover — viz §6 |
| Favorites `entityType: guide` s CRM UUID | Viz §5 — mimo tento ticket, ale CRM nesmí rozbít ostatní favorites |

**Nezasahovat:** rezervace, klienti, cuts (Můj styl), pobočky, služby, zaměstnanci, push, wallet, staff app API mimo zákaznické články.

---

## 2. Co v CRM zůstane (IN scope)

- **Staff návody** — samostatná admin sekce a datový model (jen `targetStaff` / interní audience).
- Veřejné API pro staff návody **jen pokud** je potřebuje staff aplikace; **nesdílet** endpoint se zákaznickými guides.
- Žádné `webUrl` / SEO / rubriky pro web v CRM u staff obsahu (pokud není explicitně dohodnuto jinak).

---

## 3. Fáze implementace

1. **Export** (§4) — CRM dodá oficiální dump; porovnání s `docs/crm-guides-articles-export.json` v client repu.
2. **Web** — obsah + URL v repu webu, produkční stránky `/navody/…`.
3. **App + web API** — app přepne zdroj návodů na web (checklist: `docs/app-navody-crm-offboarding.md` v client repu).
4. **Potvrzení cutover** — produkce webu + app release (nebo feature flag).
5. **CRM** — 410 na starých endpointech (min. 1 release cyklus), pak DROP tabulek / cleanup media.

---

## 4. Požadavky na jednorázový export (před DROP)

Formát: **JSON** (UTF-8) + manifest médií.

Pro každý zákaznický článek / guide (všechny záznamy, které dnes obsluhuje `/api/client/guides`):

- `id`, `title`, `titleEn`, `titleUk` (pokud existují)
- `content`, `contentEn`, `contentUk`
- `category`, `order`, `isActive`, `targetCustomer`, `targetStaff`
- `createdAt`, `updatedAt`
- `webUrl`, `webUrlEn`, `webUrlUk`, `heroImageUrl`, alt texty
- `media[]`: pořadí, caption, `mediaFile.url`, `fileType`, `mimeType`, `filename`, `s3Key` (pokud je)

Doplnit:

- Počet záznamů a checksum (SHA-256 souboru).
- Seznam media URL, která **nejsou** referencovaná jinde v CRM (bezpečné ke smazání).

Referenční export z produkce (2026-10-12):  
`Real_Barber_Client_EXPO2.0-2/docs/crm-guides-articles-export.json`  
`Real_Barber_Client_EXPO2.0-2/docs/crm-guides-articles-export.md`

---

## 5. Oblíbené (favorites) — upozornění

Mobilní app ukládá oblíbené s `entityType: "guide"` a `entityId` = CRM UUID.

Po odstranění guides z CRM:

- staré favorite záznamy mohou vést na neexistující ID;
- migrace ID na web slug je **úkol app + web**, ne blocker pro DROP v CRM po cutover;
- CRM endpoint `POST/GET /api/client/favorites` **neměnit** kromě případného cleanup jobu na mrtvé entity (volitelné, domluvit).

---

## 6. Vypnutí API (doporučená odpověď)

```
HTTP/1.1 410 Gone
Sunset: Sat, 01 Jan 2028 00:00:00 GMT
Content-Type: application/json

{
  "error": "guides_removed",
  "message": "Customer guides moved to realbarber.cz. Update the app.",
  "documentation": "https://realbarber.cz/navody/"
}
```

Endpointy minimálně:

- `GET /api/client/guides`
- veřejné `/api/public/articles`, legacy routes dle §1

---

## 7. Kontrolní seznam před smazáním DB

- [ ] Export §4 doručen a schválen web týmem
- [ ] Web: všechny aktivní články z exportu publikované v repu
- [ ] App: release nebo flag — návody nevolají CRM (nebo mají fallback na web)
- [ ] 410 nasazeno na produkci CRM
- [ ] Staff návody ověřeny v adminu (oddělená sekce)
- [ ] Žádné jiné služby nevolají odstraněné endpointy (grep v CRM + web + app repu)

---

## 8. Reference — kdo dnes volá `GET /api/client/guides`

| Produkt | Soubor / obrazovka |
|---------|-------------------|
| Mobilní app | `app/(tabs)/(home)/guides.tsx`, `app/screens/guide-detail.tsx` |
| API modul | `api/guides.ts` |
| Oblíbené → detail | `utils/favoriteDetailHref.ts` (`entityType: guide`) |

Staff app / CRM admin — ověřit zvlášť; nesmí být omylem smazáno s staff návody.
