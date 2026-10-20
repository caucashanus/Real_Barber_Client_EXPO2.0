# App: příprava na vypnutí CRM guides (bez rozbití zbytku app)

**Stav:** příprava — **CRM endpoint stále používáme** až do cutover.  
**CRM zadání:** `docs/crm-zadani-clanky-odstraneni.md`

---

## Co se mění (jen Návody)

| Dnes | Po cutover |
|------|------------|
| `GET https://crm.xrb.cz/api/client/guides` | Web BFF nebo statický JSON z `EXPO_PUBLIC_WEB_ORIGIN` (smluvně TBD s web týmem) |
| Detail `id` = CRM UUID | `id` = web slug nebo stabilní ID z repa |
| Favorite `entityType: guide` + CRM UUID | Migrace na web ID / slug (jednorázově nebo best-effort) |

---

## Dotčené soubory (nic jiného)

- `api/guides.ts` — jediné CRM volání pro návody
- `app/(tabs)/(home)/guides.tsx` — seznam
- `app/screens/guide-detail.tsx` — detail, prev/next z cache
- `utils/favoriteDetailHref.ts` — deep link z oblíbených
- `utils/breadcrumbs.ts` — `/guides` beze změny URL v app
- `components/HomeTabs.tsx` — tab Návody beze změny
- `constants/deepLinkConfig.ts` — `/guides` zůstává

**Nezasahovat:** `guide-my-haircuts.tsx` (statický onboarding Můj styl), cuts, booking, auth, wallet, branches, …

---

## Cutover checklist (až bude web API)

1. Domluvit kontrakt JSON (pole kompatibilní s `ClientGuide` nebo mapper v `api/guides.ts`).
2. Přidat `fetchWebGuides()` a v `getClientGuides()` přepnout zdroj (env `EXPO_PUBLIC_GUIDES_SOURCE=web|crm`, default **`crm`** do cutover).
3. Otestovat: seznam, detail, horizontální media, video, PDF, prev/next, offline chyba.
4. Favorites: nové ukládání s web ID; staré CRM UUID — fallback otevřít `webUrl` v in-app browser nebo skrýt srdíčko.
5. Release app **před** nebo **současně** s CRM 410.
6. Odstranit CRM větev z `api/guides.ts` až po Sunset období.

---

## Chování při 410 (do doby cutover)

Beze změny kódu: uživatel uvidí chybu na tabu Návody (`guides.tsx` catch). Po cutover bez release = špatně → proto pořadí v §7 v CRM zadání.

Volitelné později: friendly empty state + odkaz na web `/navody/` (jen v guides obrazovkách).

---

## Export obsahu pro web

- `docs/crm-guides-articles-export.json` — plná odpověď API
- `docs/crm-guides-articles-export.md` — čitelný obsah

Obnovení exportu:

```bash
curl -sS 'https://crm.xrb.cz/api/client/guides' -o docs/crm-guides-articles-export.json
```

---

## API audit

`client-app-api-usage.csv` — řádek „Průvodci / guides“. Po cutover aktualizovat zdroj na web.
