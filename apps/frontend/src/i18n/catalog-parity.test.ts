import { describe, expect, it } from "vitest";

import { NAMESPACES, SUPPORTED_LOCALE_CODES } from "./locales";

const catalogs = import.meta.glob<Record<string, unknown>>("./locales/*/*.json", {
  eager: true,
  import: "default",
});

// CLDR plural categories are per-language — zh/ja/ko only have `other`, so they
// legitimately omit `_one` keys that English carries. `_zero` is deliberately
// absent: the only keys ending in it are `activity:form.err_*_gt_zero`
// ("must be greater than 0"), where it is part of the name, not a category.
const PLURAL_SUFFIX = /_(one|two|few|many|other)$/;

function baseKeys(catalog: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(catalog).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === "object"
      ? baseKeys(value as Record<string, unknown>, path)
      : [path.replace(PLURAL_SUFFIX, "")];
  });
}

function keysFor(locale: string, namespace: string) {
  const catalog = catalogs[`./locales/${locale}/${namespace}.json`];
  if (!catalog) throw new Error(`Missing catalog ${locale}/${namespace}.json`);
  return [...new Set(baseKeys(catalog))].sort();
}

describe("translation catalogs", () => {
  it.each(SUPPORTED_LOCALE_CODES.filter((code) => code !== "en"))(
    "defines exactly the English keys for %s",
    (locale) => {
      for (const namespace of NAMESPACES) {
        expect(keysFor(locale, namespace), `${locale}/${namespace}`).toEqual(
          keysFor("en", namespace),
        );
      }
    },
  );
});
