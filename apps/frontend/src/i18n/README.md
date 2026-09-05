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
    zh-Hant/<ns>.json
    ja/<ns>.json
    ko/<ns>.json
    it/<ns>.json
```

Namespaces (one JSON file each): `common`, `dashboard`, `holdings`, `activity`,
`performance`, `account`, `settings`, `goals`, `income`, `insights`, `asset`,
`spending`, `ui`, `ai`, `allocation`, `onboarding`, `auth`, `health`, `sync`,
and `connect`.

## Supported languages and translation sources

| Code      | Display name | Translation source                                                                                                                                                                                                           |
| --------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `en`      | English      | Canonical source catalog. New keys and meaning changes start here.                                                                                                                                                           |
| `fr`      | Français     | Adapted from community PR #416; interpolation was converted from `{var}` to i18next `{{var}}`.                                                                                                                               |
| `de`      | Deutsch      | Value-joined from community PR #845 by matching English source text; unmatched content was completed as a draft for community review. See `scripts/i18n-remap.mjs`.                                                          |
| `es`      | Español      | Full neutral international Spanish catalog contributed across all namespaces.                                                                                                                                                |
| `pt`      | Português    | Community contribution from PR #1533, with full namespace coverage in Brazilian Portuguese and CLDR `many` plural forms; intended for continued community review.                                                            |
| `zh`      | 简体中文     | Full Simplified Chinese catalog anchored to the terminology from community PR #210.                                                                                                                                          |
| `zh-Hant` | 繁體中文     | Translated from the canonical English catalogs in reviewed namespace batches, using the Taiwan Traditional Chinese glossary. Simplified Chinese was used only as a context aid, never as the translation source or fallback. |
| `ja`      | 日本語       | Full contributor-authored Japanese catalog using a shared terminology glossary and Japanese product-UI conventions.                                                                                                          |
| `ko`      | 한국어       | Full AI-drafted Korean catalog using standard financial terminology, intended for continued community review.                                                                                                                |
| `it`      | Italiano     | Community contribution from PR #1588, with full namespace coverage and Italian CLDR `many` plural forms; intended for continued community review.                                                                            |

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
missing keys in every non-English locale fall back to `en`. Traditional Chinese
aliases such as `zh-TW`, `zh-HK`, and `zh-MO` normalize to the canonical
`zh-Hant` code, which falls back directly to `en`, never to Simplified Chinese
`zh`.

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

A locale code is public API — addons read it, and it is persisted per device —
so pick it deliberately before shipping. These places have to agree:

1. `locales/<code>/` — one JSON file per namespace, complete parity with `en`.
2. `SUPPORTED_LOCALES` in `locales.ts`.
3. `locales` in `i18next.config.ts`.
4. `SUPPORTED_UI_LANGUAGES` in `crates/core/src/settings/settings_service.rs`,
   plus any alias normalization (`fr-CA` -> `fr`).
5. `addon-sandbox-i18n.ts`, if the locale should reach addon iframes.
6. Check `new Intl.PluralRules("<code>").resolvedOptions().pluralCategories`. A
   locale with a `many` category (fr, es, pt, it) needs a `_many` form for every
   plural stem — i18next echoes the raw key back when the form is missing.
7. If the language has its own number/date conventions, add a formatting region:
   `FORMATTING_REGIONS` + `FORMATTING_REGION_LOCALES` in
   `packages/ui/src/lib/formatting.ts`, `SUPPORTED_FORMATTING_REGIONS` in
   `settings_service.rs`, the two region pickers, and a
   `settings:formattingRegion.options.*` label in every locale.
8. Run catalog parity, interpolation/plural tests, `i18n:status`, and the
   frontend type-check before shipping.

### Naming

Bare language codes (`fr`, `ja`) unless the language is written in more than one
script. Chinese is the case that matters: `zh` means Simplified (CLDR expands it
to `zh-Hans-CN`) and `zh-Hant` means Traditional. Name Chinese variants by
**script**, not region — one `zh-Hant` catalog serves Taiwan, Hong Kong and
Macau, and regional differences belong in `formattingRegion`, which is a
separate setting. A `zh-Hant-HK` catalog can be added later and will fall back
to `zh-Hant`; that path does not exist from a region-named `zh-TW`.

Fallback never crosses a script boundary: a missing `zh-Hant` string resolves to
`en`, not `zh`. Mixed glyphs read as broken, untranslated text reads as missing.

### Terminology

Each locale should carry a glossary test (see `traditional-chinese.test.ts`)
asserting the term the catalog standardises on and rejecting its alternates. Key
parity and a green suite do not catch a catalog that says "Return" three
different ways — only a glossary does.

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
- **Traditional Chinese (`zh-Hant`)**: contributed in PR #1566, machine-seeded
  from the English source and reviewed for Taiwan financial terminology by a
  native speaker; intended for continued community review.

Non-English catalogs are machine-drafted and community-corrected. Terminology
reports are expected and welcome — file them as issues against the locale.
