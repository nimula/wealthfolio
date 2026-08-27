# Internationalization (i18n)

Wealthfolio uses [i18next](https://www.i18next.com/) +
[react-i18next](https://react.i18next.com/).

## Layout

```
src/i18n/
  i18n.ts        # runtime init (lazy-loads locale JSON, no browser auto-detect)
  locales.ts     # SUPPORTED_LOCALES, NAMESPACES, DEFAULT_LOCALE  (single source of truth)
  locales/
    en/<ns>.json # source language (canonical keys)
    fr/<ns>.json
    de/<ns>.json
    es/<ns>.json
    pt/<ns>.json
    zh/<ns>.json
    zh-TW/<ns>.json
    ja/<ns>.json
    ko/<ns>.json
    it/<ns>.json
```

Namespaces (one JSON file each): `common`, `dashboard`, `holdings`, `activity`,
`performance`, `account`, `settings`, `goals`, `income`, `insights`, `asset`,
`spending`, `ui`, `ai`, `allocation`, `onboarding`, `auth`, `health`, `sync`,
and `connect`.

## Supported languages and translation sources

| Code    | Display name     | Translation source                                                                                                                                                                                                           |
| ------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `en`    | English          | Canonical source catalog. New keys and meaning changes start here.                                                                                                                                                           |
| `fr`    | Français         | Adapted from community PR #416; interpolation was converted from `{var}` to i18next `{{var}}`.                                                                                                                               |
| `de`    | Deutsch          | Value-joined from community PR #845 by matching English source text; unmatched content was completed as a draft for community review. See `scripts/i18n-remap.mjs`.                                                          |
| `es`    | Español          | Full neutral international Spanish catalog contributed across all namespaces.                                                                                                                                                |
| `pt`    | Português        | Community contribution from PR #1533, with full namespace coverage in Brazilian Portuguese and CLDR `many` plural forms; intended for continued community review.                                                            |
| `zh`    | 简体中文         | Full Simplified Chinese catalog anchored to the terminology from community PR #210.                                                                                                                                          |
| `zh-TW` | 繁體中文（台灣） | Translated from the canonical English catalogs in reviewed namespace batches, using the Taiwan Traditional Chinese glossary. Simplified Chinese was used only as a context aid, never as the translation source or fallback. |
| `ja`    | 日本語           | Full contributor-authored Japanese catalog using a shared terminology glossary and Japanese product-UI conventions.                                                                                                          |
| `ko`    | 한국어           | Full AI-drafted Korean catalog using standard financial terminology, intended for continued community review.                                                                                                                |
| `it`    | Italiano         | Community contribution from PR #1588, with full namespace coverage and Italian CLDR `many` plural forms; intended for continued community review.                                                                            |

Every supported locale must contain the same namespace and base-key structure as
`en`; `catalog-parity.test.ts` enforces this contract.

## Using translations in code

Keys are referenced with the fully-qualified `namespace:key` form so the default
hook works everywhere:

```tsx
import { useTranslation } from "react-i18next";

function Example() {
  const { t } = useTranslation();
  return <h1>{t("settings:title")}</h1>;
}
```

Interpolation uses i18next's `{{var}}` syntax:
`t("common:activities_count", { count })`.

## Language selection

Language is an **explicit, stored user setting** (`Settings.language`), not
browser-detected. It is chosen during onboarding and in Settings → General, and
persisted through the normal settings pipeline (stored per-device, like `theme`
and `baseCurrency` — device-sync is not enabled for it). The settings provider
applies it via `i18n.changeLanguage()` on load and on change. Default is `en`;
missing keys in every non-English locale fall back to `en`. Regional locale
codes are preserved when supported: `zh-TW` remains `zh-TW` and falls back
directly to `en`, never to Simplified Chinese `zh`.

## Maintenance (i18next-cli)

Config: `apps/frontend/i18next.config.ts`.

```bash
pnpm --filter frontend i18n:status   # coverage per namespace/locale
pnpm --filter frontend i18n:extract  # sync JSON with t() keys used in code
pnpm --filter frontend i18n:lint     # find remaining hardcoded strings
pnpm --filter frontend i18n:types    # generate typed keys
```

`extract` never removes unreferenced keys (`removeUnusedKeys: false`) so
community-contributed translations are preserved.

## Adding a language

1. Add a `locales/<code>/` folder with the namespace JSON files.
2. Add an entry to `SUPPORTED_LOCALES` in `locales.ts` and `locales` in
   `i18next.config.ts`.
3. Add the code to `SUPPORTED_UI_LANGUAGES` in
   `crates/core/src/settings/settings_service.rs` so the backend persists it.
4. Add the locale's `ui` catalog to the statically bundled resources in
   `src/addons/iframe/addon-sandbox-i18n.ts`; its `Record<LocaleCode, ...>` type
   intentionally fails type-check when a supported locale is missing.
5. Check `new Intl.PluralRules("<code>").resolvedOptions().pluralCategories`. A
   locale with a `many` category (fr, es, pt, it) needs a `_many` form for every
   plural stem — i18next echoes the raw key back when the form is missing.
6. If the language has its own number/date conventions, add a formatting region:
   `FORMATTING_REGIONS` + `FORMATTING_REGION_LOCALES` in
   `packages/ui/src/lib/formatting.ts`, `SUPPORTED_FORMATTING_REGIONS` in
   `settings_service.rs`, the two region pickers, and a
   `settings:formattingRegion.options.*` label in every locale.
7. Run catalog parity, interpolation/plural tests, `i18n:status`, and the
   frontend type-check before shipping.

## Provenance of current translations

- **English keys + French**: adapted from PR #416 (namespaced structure, 100%
  FR), with single-brace `{var}` interpolation converted to i18next `{{var}}`.
- **German**: value-joined from PR #845 by matching English source text onto the
  English keys (~65% auto-coverage); the remainder falls back to English and is
  filled by AI draft + community review. See `scripts/i18n-remap.mjs`.
- **Korean**: AI-drafted, full-coverage translation of all namespaces against
  the English source keys, using standard Korean financial/investment
  terminology; intended for community review.
- **Italian**: community contribution (PR #1588), full coverage of all
  namespaces, reviewed against the terminology already used by the French and
  Spanish sets (`Posizioni`, `Classe di attività`, `Costo di carico`) and
  Italian sentence case; `_many` plural forms are required because Italian has a
  CLDR `many` category. Intended for continued community review.
- **Portuguese (pt-BR)**: community contribution (PR #1533), full coverage of
  all namespaces in Brazilian Portuguese. Terminology follows Brazilian market
  usage — `Posições`, `Carteira`, `Custo de aquisição`, `Rentabilidade`, `L/P`,
  `Valores mobiliários`, `Aportes`, `Desdobramento de ações` — and Brazilian
  punctuation (`"..."`, never `«...»`). `_many` plural forms are required
  because Portuguese has a CLDR `many` category. Intended for continued
  community review.
