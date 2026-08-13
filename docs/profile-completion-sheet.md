# Profile completion sheet (doplnění údajů)

> **Stav:** implementace je v kódu, ale **dočasně vypnutá** (`PROFILE_COMPLETION_SHEET_ENABLED = false`).

## Co je hotové

- UI sheetu: `components/profile/ProfileCompletionSheet.tsx` (stejný vzor jako sheet „Vyfotit / Vybrat z galerie“ v editaci profilu)
- Kroky a validace: `constants/profileCompletionSchema.ts` (pořadí email → birthday → avatar → address)
- Politika zobrazení a cooldowny: `utils/profileCompletionPolicy.ts`
- Hook pro automatické zobrazení: `hooks/useProfileCompletionPrompt.ts`
- Napojení na profil tab: `app/(tabs)/profile.tsx`
- Překlady: `locales/cs.ts`, `locales/en.ts`
- Unit testy výběru kroku: `utils/__tests__/profileCompletionSchema.test.ts`

## Co je potřeba dodělat před zapnutím

1. **Zapnout feature flag** — v `utils/profileCompletionPolicy.ts` nastavit:
   ```ts
   export const PROFILE_COMPLETION_SHEET_ENABLED = true;
   ```
2. **Ověřit UX sheetu** na iOS i Android (výška, gesto zavření, navigace na edit profil s `?focus=…`).
3. **Potvrdit produkční cooldowny** — v dev jsou 0, v produkci 14 dní globálně / 30 dní po dismissu kroku.
4. **Rozhodnout místo zobrazení** — aktuálně jen při focusu **Profil** tabu; případně doplnit i home nebo jiné triggery.

## Kdy a jak sheet zobrazovat

Sheet se má ukázat **jen prvnímu chybějícímu kroku** v tomto pořadí:

| Krok | Podmínka „hotovo“ |
|------|-------------------|
| `email` | platný e-mail (regex) |
| `birthday` | vyplněné datum narození |
| `avatar` | vlastní fotka (http/https/file URL) |
| `address` | vyplněná ulice **a** město |

### Podmínky zobrazení (všechny musí platit)

1. `PROFILE_COMPLETION_SHEET_ENABLED === true`
2. Uživatel je přihlášen a `ClientMe` je načtený
3. `pickProfileCompletionStep(client)` vrátí nějaký krok (profil není kompletní)
4. **Min. počet otevření app** — produkčně ≥ 2 (`PROFILE_COMPLETION_MIN_APP_OPENS`, klíč `@app_opens`)
5. **Globální cooldown** — od posledního promptu uplynulo ≥ 14 dní (`PROFILE_COMPLETION_GLOBAL_COOLDOWN_MS`)
6. **Dismiss konkrétního kroku** — uživatel sheet pro daný krok nezavřel gestem v posledních 30 dnech (`PROFILE_COMPLETION_DISMISS_MS`)

### Chování po interakci

- **CTA „Doplnit“** — zavře sheet, naviguje na `/screens/edit-profile?focus={step}`, krok se neukládá jako dismissed
- **Zavření gestem / swipe dolů** — `dismissProfileCompletionStep(step)` uloží 30denní pauzu pro daný krok
- Po zobrazení se zapíše čas do `@profile_completion_last_prompt_at`

### Trigger (současný stav)

- `useProfileCompletionPrompt` běží v `PersonalProfile` při **focusu profil tabu**
- Po splnění podmínek sheet otevře s delay ~900 ms

## Související soubory

```
components/profile/ProfileCompletionSheet.tsx
constants/profileCompletionSchema.ts
utils/profileCompletionPolicy.ts
hooks/useProfileCompletionPrompt.ts
app/(tabs)/profile.tsx
app/screens/edit-profile.tsx          # focus param pro scroll/zvýraznění pole
utils/__tests__/profileCompletionSchema.test.ts
```

## Testování po zapnutí

1. Nastavit `PROFILE_COMPLETION_SHEET_ENABLED = true`
2. Účet s chybějícím e-mailem (nebo jiným krokem)
3. Otevřít Profil tab — sheet by se měl zobrazit jednou za cooldown
4. Ověřit dismiss gestem a že se stejný krok neukáže 30 dní
5. Ověřit CTA → edit profil s správným `focus`
