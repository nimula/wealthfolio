import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AmountDisplay,
  DatePickerInput,
  FormattingProvider,
  useAmountFormatting,
  useDateFormatting,
  useDateFnsLocale,
  useLocalizationSettings,
  useNumberFormatting,
} from "@wealthfolio/ui";
import { type ReactElement, useState } from "react";
import { describe, expect, it } from "vitest";

function LocaleSwitcher() {
  const [locale, setLocale] = useState("en-US");
  return (
    <FormattingProvider locale={locale} timezone="UTC">
      <AmountDisplay value={1234.56} currency="EUR" />
      <button type="button" onClick={() => setLocale("fr-FR")}>
        {locale}
      </button>
    </FormattingProvider>
  );
}

function FormattingConsumer() {
  void {
    ...useLocalizationSettings(),
    ...useAmountFormatting(),
    ...useNumberFormatting(),
    ...useDateFormatting(),
  };
  return null;
}

function AmountFormattingConsumer() {
  useAmountFormatting();
  return null;
}

const observedAmountServices: unknown[] = [];
function AmountServiceConsumer() {
  observedAmountServices.push(useAmountFormatting());
  return null;
}

const observedServices: { amount: unknown; number: unknown; date: unknown }[] = [];
function ServiceIdentityConsumer() {
  observedServices.push({
    amount: useAmountFormatting(),
    number: useNumberFormatting(),
    date: useDateFormatting(),
  });
  return null;
}

function RegionalNumber() {
  return <span>{useNumberFormatting().formatDecimal(1234.56)}</span>;
}

function RegionalCalendar() {
  const locale = useDateFnsLocale();
  return <span>{`${locale.localize.month(0)}:${locale.options?.weekStartsOn}`}</span>;
}

function RegionalFormattedMonth() {
  const formatting = useDateFormatting();
  return <span>{formatting.formatCalendarDate("2026-01-01", { month: "long" })}</span>;
}

function LocalizationSettingsConsumer() {
  const { locale, uiLocale } = useLocalizationSettings();
  return <span>{locale + "|" + uiLocale}</span>;
}

describe("FormattingProvider", () => {
  it("reactively updates presentation without a reload", async () => {
    const { user } = setupUser(<LocaleSwitcher />);
    expect(screen.getByText("€1,234.56")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "en-US" }));

    expect(screen.getByText(/^1[\u00a0\u202f ]234,56\s*€$/)).toBeInTheDocument();
  });

  it("preserves finance privacy masking", () => {
    render(
      <FormattingProvider locale="en-US">
        <AmountDisplay value={1234.56} currency="USD" isHidden />
      </FormattingProvider>,
    );
    expect(screen.getByText("••••")).toBeInTheDocument();
  });

  it("uses the formatting locale for numbers and calendar date content", () => {
    render(
      <FormattingProvider locale="DE" uiLocale="en">
        <RegionalNumber />
        <RegionalCalendar />
        <RegionalFormattedMonth />
      </FormattingProvider>,
    );
    expect(screen.getByText("1.234,56")).toBeInTheDocument();
    expect(screen.getByText("Januar:1")).toBeInTheDocument();
    expect(screen.getByText("Januar")).toBeInTheDocument();
  });

  it.each([
    {
      formattingLocale: "DE",
      uiLocale: "zh-TW",
      expectedSettings: "de-DE|zh-TW",
      expectedNumber: "1.234,56",
      expectedSegments: ["year", "month", "day"],
      expectedDescription: /選定的日期：/,
    },
    {
      formattingLocale: "TW",
      uiLocale: "zh",
      expectedSettings: "zh-TW|zh",
      expectedNumber: "1,234.56",
      expectedSegments: ["year", "month", "day"],
      expectedDescription: /\u9009\u5b9a\u7684\u65e5\u671f\uff1a/,
    },
    {
      formattingLocale: "TW",
      uiLocale: "en",
      expectedSettings: "zh-TW|en",
      expectedNumber: "1,234.56",
      expectedSegments: ["month", "day", "year"],
      expectedDescription: /Selected Date:/,
    },
  ])(
    "keeps the $uiLocale UI locale separate from the $formattingLocale formatting region",
    ({
      formattingLocale,
      uiLocale,
      expectedSettings,
      expectedNumber,
      expectedSegments,
      expectedDescription,
    }) => {
      render(
        <FormattingProvider locale={formattingLocale} uiLocale={uiLocale}>
          <LocalizationSettingsConsumer />
          <RegionalNumber />
          <DatePickerInput value="2026-08-18" onChange={() => undefined} />
        </FormattingProvider>,
      );

      expect(screen.getByText(expectedSettings)).toBeInTheDocument();
      expect(screen.getByText(expectedNumber)).toBeInTheDocument();
      expect(screen.getByText(expectedDescription)).toBeInTheDocument();
      expect(screen.getAllByRole("spinbutton").map((segment) => segment.dataset.type)).toEqual(
        expectedSegments,
      );
    },
  );

  it("reuses the provider-owned finance service across consumers", () => {
    observedAmountServices.length = 0;
    render(
      <FormattingProvider locale="US" uiLocale="en">
        <AmountServiceConsumer />
        <AmountServiceConsumer />
      </FormattingProvider>,
    );
    expect(observedAmountServices).toHaveLength(2);
    expect(observedAmountServices[0]).toBe(observedAmountServices[1]);
  });

  it("keeps amount and number services stable across timezone-only updates", () => {
    observedServices.length = 0;
    const { rerender } = render(
      <FormattingProvider locale="US" uiLocale="en" timezone="UTC">
        <ServiceIdentityConsumer />
      </FormattingProvider>,
    );
    const initial = observedServices.at(-1)!;

    rerender(
      <FormattingProvider locale="US" uiLocale="en" timezone="America/Toronto">
        <ServiceIdentityConsumer />
      </FormattingProvider>,
    );
    const updated = observedServices.at(-1)!;

    expect(updated.amount).toBe(initial.amount);
    expect(updated.number).toBe(initial.number);
    expect(updated.date).not.toBe(initial.date);
  });

  it("keeps public components and hooks usable without a provider", () => {
    render(
      <>
        <FormattingConsumer />
        <AmountFormattingConsumer />
        <AmountDisplay value={1234.56} currency="USD" />
      </>,
    );
    expect(screen.getByText("$1,234.56")).toBeInTheDocument();
  });
});

function setupUser(element: ReactElement) {
  return {
    ...render(element),
    user: userEvent.setup(),
  };
}
