import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { OnboardingStep2 } from "./onboarding-step2";

const mocks = vi.hoisted(() => ({
  settings: { language: "en" } as {
    language: string;
    formattingRegion?: string;
    baseCurrency?: string;
    timezone?: string;
  },
  updateSettings: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/settings-provider", () => ({
  useSettingsContext: () => ({
    settings: mocks.settings,
    updateSettings: mocks.updateSettings,
  }),
}));

function renderStep2(language = "en", settings: Partial<typeof mocks.settings> = {}) {
  mocks.settings = { language, ...settings };
  return render(<OnboardingStep2 onNext={vi.fn()} onValidityChange={vi.fn()} />);
}

describe("OnboardingStep2 language picker", () => {
  it("shows only the popular languages as chips", () => {
    renderStep2();

    for (const code of ["en", "fr", "de", "es", "zh", "ja", "ko"]) {
      expect(screen.getByTestId(`language-${code}-button`)).toBeInTheDocument();
    }
    // Everything else lives behind the "Other" chip.
    expect(screen.queryByTestId("language-pt-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("language-it-button")).not.toBeInTheDocument();
  });

  it("lists every supported locale in the overlay", async () => {
    const user = userEvent.setup();
    renderStep2();

    await user.click(screen.getAllByRole("button", { name: /other/i })[0]);

    for (const locale of SUPPORTED_LOCALES) {
      expect(screen.getAllByTestId(`language-${locale.code}-button`).length).toBeGreaterThan(0);
    }
    // A popular language now appears both as a chip and as an overlay row.
    expect(screen.getAllByTestId("language-en-button")).toHaveLength(2);
  });

  it("filters the overlay and reports when nothing matches", async () => {
    const user = userEvent.setup();
    renderStep2();

    await user.click(screen.getAllByRole("button", { name: /other/i })[0]);
    const search = screen.getByPlaceholderText("Search languages...");

    await user.type(search, "portug");
    expect(screen.getByTestId("language-pt-button")).toBeInTheDocument();
    expect(screen.queryByTestId("language-it-button")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "zzzz");
    expect(screen.getByText("No languages found")).toBeInTheDocument();
  });

  it("substitutes the selected language into the chips when it is not popular", () => {
    renderStep2("pt");

    expect(screen.getByTestId("language-pt-button")).toBeInTheDocument();
    // It takes the last popular slot rather than growing the row.
    expect(screen.queryByTestId("language-ko-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("language-en-button")).toBeInTheDocument();
  });

  it("derives the initial currency from the formatting region", async () => {
    renderStep2("en", { formattingRegion: "TW" });

    await waitFor(() =>
      expect(screen.getByTestId("currency-twd-button")).toHaveClass("text-primary"),
    );
  });

  it("keeps an existing base currency when the UI language changes", async () => {
    const user = userEvent.setup();
    renderStep2("en", { formattingRegion: "TW", baseCurrency: "JPY" });

    await waitFor(() =>
      expect(screen.getByTestId("currency-jpy-button")).toHaveClass("text-primary"),
    );
    await user.click(screen.getByTestId("language-fr-button"));

    expect(screen.getByTestId("currency-jpy-button")).toHaveClass("text-primary");
  });

  it("updates an untouched currency recommendation with the formatting region", async () => {
    const user = userEvent.setup();
    renderStep2("en", { formattingRegion: "US" });

    await waitFor(() =>
      expect(screen.getByTestId("currency-usd-button")).toHaveClass("text-primary"),
    );
    await user.click(
      within(screen.getByTestId("onboarding-formatting-locale")).getByRole("button", {
        name: /canada/i,
      }),
    );

    expect(screen.getByTestId("currency-cad-button")).toHaveClass("text-primary");
    expect(mocks.updateSettings).toHaveBeenCalledWith({ formattingRegion: "CA" });
  });
});
