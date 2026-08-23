import type { Settings } from "@/lib/types";
import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n, { LANGUAGE_STORAGE_KEY } from "@/i18n/i18n";

const mocks = vi.hoisted(() => ({
  settings: null as Settings | null,
  mutateAsync: vi.fn(),
  refetch: vi.fn(),
  setAddonLocalizationSnapshot: vi.fn(),
}));

vi.mock("@/adapters", () => ({
  isDesktop: false,
  logger: { error: vi.fn() },
}));

vi.mock("@/addons/iframe/addon-sandbox-localization", () => ({
  setAddonLocalizationSnapshot: mocks.setAddonLocalizationSnapshot,
}));

vi.mock("@/hooks/use-settings", () => ({
  useSettings: () => ({
    data: mocks.settings,
    isLoading: false,
    isError: false,
    refetch: mocks.refetch,
  }),
}));

vi.mock("@/hooks/use-settings-mutation", () => ({
  useSettingsMutation: () => ({ mutateAsync: mocks.mutateAsync }),
}));

import { SettingsProvider } from "./settings-provider";

const backendSettings: Settings = {
  theme: "light",
  font: "font-sans",
  language: "zh-TW",
  formattingRegion: "US",
  baseCurrency: "USD",
  defaultReturnMetric: "twr",
  timezone: "UTC",
  onboardingCompleted: true,
  autoUpdateCheckEnabled: true,
  menuBarVisible: true,
  syncEnabled: false,
};

describe("SettingsProvider localization", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.settings = backendSettings;
    localStorage.clear();
    document.documentElement.removeAttribute("lang");
    document.documentElement.removeAttribute("dir");
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    localStorage.clear();
    document.documentElement.removeAttribute("lang");
    document.documentElement.removeAttribute("dir");
    await i18n.changeLanguage("en");
  });

  it("applies a stored zh-TW backend setting without truncating the locale", async () => {
    render(
      <SettingsProvider>
        <span>ready</span>
      </SettingsProvider>,
    );

    await waitFor(() => {
      expect(i18n.language).toBe("zh-TW");
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("zh-TW");
      expect(document.documentElement).toHaveAttribute("lang", "zh-TW");
      expect(mocks.setAddonLocalizationSnapshot).toHaveBeenLastCalledWith(
        expect.objectContaining({
          uiLocale: "zh-TW",
          timezone: "UTC",
        }),
      );
    });
  });
});
