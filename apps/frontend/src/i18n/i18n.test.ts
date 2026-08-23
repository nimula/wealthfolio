import { beforeEach, describe, expect, it, vi } from "vitest";

describe("host i18n locale resolution", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it("restores zh-TW exactly and falls back to English instead of zh", async () => {
    localStorage.setItem("wealthfolio-language", "zh-TW");

    const { default: i18n, i18nReady } = await import("./i18n");
    await i18nReady;
    await i18n.loadNamespaces("common");

    expect(i18n.language).toBe("zh-TW");
    expect(i18n.languages).toContain("zh-TW");
    expect(i18n.languages).toContain("en");
    expect(i18n.languages).not.toContain("zh");

    i18n.removeResourceBundle("zh-TW", "common");
    expect(i18n.t("common:welcome")).toBe("Welcome");
  });
});
