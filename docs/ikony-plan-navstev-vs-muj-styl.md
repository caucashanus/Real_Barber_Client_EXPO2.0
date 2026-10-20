# Ikony: Plán návštěv vs. Můj styl (mobilní app)

Stejná pravidla jako na webu — viz `seo-starter-2/docs/web-ikony-plan-navstev-vs-muj-styl.md`.

| Flow | Assety | Config |
|------|--------|--------|
| **Můj styl** (wizard dnes) | `assets/img/type-*.png` (+ office, sporty, …) | `constants/haircutWizardOptions.ts` → `PROPERTY_TYPE_OPTIONS` |
| **Plán návštěv** (budoucí) | `assets/img/visit-plan/hair-*.webp` | `constants/visitPlanSetupWizardOptions.ts` |

Nepřesouvat bust WebP do kořene `assets/img/` a nepoužívat `type-*.png` v plánu návštěv.
