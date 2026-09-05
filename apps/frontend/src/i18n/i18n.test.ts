import i18next from "i18next";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("Traditional Chinese", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("i18next");
    vi.unstubAllGlobals();
  });

  it("loads zh-Hant resources instead of the Simplified Chinese locale", async () => {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => (key === "wealthfolio-language" ? "zh-Hant" : null),
    });
    vi.doMock("i18next", () => ({ default: i18next.createInstance() }));

    const { default: i18n } = await import("./i18n");
    await vi.waitFor(() => expect(i18n.isInitialized).toBe(true));

    expect(i18n.resolvedLanguage).toBe("zh-Hant");
    expect(i18n.t("common:welcome")).toBe("歡迎");
  });

  it("falls back from zh-Hant to English instead of Simplified Chinese", async () => {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => (key === "wealthfolio-language" ? "zh-Hant" : null),
    });
    vi.doMock("i18next", () => ({ default: i18next.createInstance() }));

    const { default: i18n, i18nReady } = await import("./i18n");
    await i18nReady;
    await i18n.loadNamespaces("common");

    expect(i18n.resolvedLanguage).toBe("zh-Hant");
    expect(i18n.languages).toContain("zh-Hant");
    expect(i18n.languages).toContain("en");
    expect(i18n.languages).not.toContain("zh");

    i18n.removeResourceBundle("zh-Hant", "common");
    expect(i18n.t("common:welcome")).toBe("Welcome");
  });
});
