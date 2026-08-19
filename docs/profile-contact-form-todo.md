# Profil → Kontakty → Kontaktní formulář (TODO)

## Stav

Položka **Kontaktní formulář** v sekci **Kontakty** na obrazovce profilu je v app **dočasně skrytá**.

## Co je potřeba dodělat

- Znovu zobrazit řádek v `components/profile/ProfileContactsSection.tsx` (locale: `profileContactsForm`).
- Dokončit / ověřit flow `ProfileContactFormSheet` — odeslání formuláře na backend, validace, success/error stavy, parita s webem.
- Otestovat v CS / EN / UK.

## Kde to v kódu je

| Soubor | Účel |
|---|---|
| `components/profile/ProfileContactsSection.tsx` | seznam položek v sekci Kontakty |
| `components/profile/ProfileContactFormSheet.tsx` | sheet s kontaktním formulářem (zatím nepřipojen) |

## Poznámka

Ostatní položky sekce Kontakty (Telefon, Ochrana údajů, Pobočky, Sdílet web) zůstávají viditelné.
