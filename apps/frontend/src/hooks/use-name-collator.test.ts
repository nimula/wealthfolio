import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useNameCollator } from "./use-name-collator";

const localization = vi.hoisted(() => ({ uiLocale: "en" }));

vi.mock("@wealthfolio/ui", () => ({
  useLocalizationSettings: () => localization,
}));

afterEach(() => {
  localization.uiLocale = "en";
  vi.restoreAllMocks();
});

describe("useNameCollator", () => {
  it("recreates the name comparator when the UI locale changes", () => {
    const collator = vi.spyOn(Intl, "Collator").mockImplementation(function () {
      return {
        compare: vi.fn(() => 0),
      } as unknown as Intl.Collator;
    });
    const { result, rerender } = renderHook(() => useNameCollator());
    const englishComparator = result.current;

    expect(collator).toHaveBeenCalledWith("en");

    localization.uiLocale = "zh-TW";
    rerender();

    expect(collator).toHaveBeenLastCalledWith("zh-TW");
    expect(result.current).not.toBe(englishComparator);
  });
});
