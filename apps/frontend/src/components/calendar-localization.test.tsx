import { createRef } from "react";
import { parseTime } from "@internationalized/date";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calendar, DatePickerInput, FormattingProvider, MonthYearPicker } from "@wealthfolio/ui";
import { describe, expect, it, vi } from "vitest";
import {
  Calendar as ReactAriaCalendar,
  RangeCalendar as ReactAriaRangeCalendar,
} from "../../../../packages/ui/src/components/ui/calendar-rac";
import {
  DateInput as ReactAriaDateInput,
  TimeField as ReactAriaTimeField,
} from "../../../../packages/ui/src/components/ui/datefield-rac";
import { MonthSwitcher } from "../features/spending/components/month-switcher";

describe("calendar localization policy", () => {
  it("formats month choices with the formatting locale", () => {
    render(
      <FormattingProvider locale="ja-JP" uiLocale="en">
        <MonthYearPicker value="2026-01" maxDate="2026-12" />
      </FormattingProvider>,
    );

    expect(screen.getByRole("button", { name: "1月" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Jan" })).not.toBeInTheDocument();
  });

  it.each(["fa-IR", "th-TH"])(
    "keeps Gregorian month picker state aligned with %s labels",
    async (locale) => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const january = new Intl.DateTimeFormat(locale, {
        calendar: "gregory",
        month: "long",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(2020, 0, 1)));
      const year = new Intl.DateTimeFormat(locale, {
        calendar: "gregory",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(2026, 0, 1)));

      render(
        <FormattingProvider locale={locale} uiLocale="en">
          <MonthYearPicker value="2026-01" maxDate="2026-12" onChange={onChange} />
        </FormattingProvider>,
      );

      expect(screen.getByText(year)).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: january }));
      expect(onChange).toHaveBeenCalledWith("2026-01");
    },
  );

  it.each(["fa-IR", "th-TH"])("labels the Gregorian report month correctly in %s", (locale) => {
    const expected = new Intl.DateTimeFormat(locale, {
      calendar: "gregory",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2026, 7, 1)));

    render(
      <FormattingProvider locale={locale} uiLocale="en">
        <MonthSwitcher
          selectedMonth="2026-08"
          availableMonths={["2026-08"]}
          onMonthChange={vi.fn()}
        />
      </FormattingProvider>,
    );

    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("uses UI-language labels for DayPicker controls", () => {
    render(
      <FormattingProvider locale="de-DE" uiLocale="en">
        <Calendar defaultMonth={new Date(2026, 7, 1)} />
      </FormattingProvider>,
    );

    expect(screen.getByRole("button", { name: "Previous month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next month" })).toBeInTheDocument();
  });

  it("uses UI-language labels for React Aria calendar controls", async () => {
    const user = userEvent.setup();
    render(
      <FormattingProvider locale="de-DE" uiLocale="en">
        <DatePickerInput value="2026-08-18" onChange={vi.fn()} />
      </FormattingProvider>,
    );

    await user.click(screen.getByRole("button", { name: /Pick a date/ }));

    expect(await screen.findByRole("button", { name: "Previous month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next month" })).toBeInTheDocument();
  });

  it("reuses a parent TimeField state in DateInput", () => {
    render(
      <FormattingProvider locale="en-US" uiLocale="en">
        <ReactAriaTimeField aria-label="Time" value={parseTime("13:45")}>
          <ReactAriaDateInput />
        </ReactAriaTimeField>
      </FormattingProvider>,
    );

    const segmentTypes = screen.getAllByRole("spinbutton").map((segment) => segment.dataset.type);
    expect(segmentTypes).toContain("hour");
    expect(segmentTypes).toContain("minute");
    expect(segmentTypes).not.toContain("month");
  });

  it("preserves React Aria calendar DOM props and forwarded refs", () => {
    const calendarRef = createRef<HTMLDivElement>();
    const rangeCalendarRef = createRef<HTMLDivElement>();

    render(
      <FormattingProvider locale="zh-TW" uiLocale="en">
        <ReactAriaCalendar
          ref={calendarRef}
          aria-label="Single calendar"
          id="single-calendar"
          data-testid="single-calendar"
        />
        <ReactAriaRangeCalendar
          ref={rangeCalendarRef}
          aria-label="Range calendar"
          id="range-calendar"
          data-testid="range-calendar"
        />
      </FormattingProvider>,
    );

    const calendar = screen.getByTestId("single-calendar");
    const rangeCalendar = screen.getByTestId("range-calendar");

    expect(calendar).toHaveAttribute("id", "single-calendar");
    expect(rangeCalendar).toHaveAttribute("id", "range-calendar");
    expect(calendarRef.current).toBe(calendar);
    expect(rangeCalendarRef.current).toBe(rangeCalendar);
  });

  it("keeps React Aria date selection wired after locale separation", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const target = new Date(Date.UTC(2026, 7, 19));
    const targetLabel = new Intl.DateTimeFormat("en", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(target);

    render(
      <FormattingProvider locale="de-DE" uiLocale="en">
        <DatePickerInput value="2026-08-18" onChange={onChange} />
      </FormattingProvider>,
    );

    await user.click(screen.getByRole("button", { name: /Pick a date/ }));
    await user.click(await screen.findByRole("button", { name: targetLabel }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toEqual(new Date(2026, 7, 19));
  });

  it.each([
    { locale: "de-DE", uiLocale: "zh-TW", firstDay: 1 },
    { locale: "zh-TW", uiLocale: "en", firstDay: 0 },
  ])(
    "uses $locale for the React Aria calendar heading and week layout",
    async ({ locale, uiLocale, firstDay }) => {
      const user = userEvent.setup();
      const expectedHeading = new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(2026, 7, 1)));
      const expectedWeekDays = Array.from({ length: 7 }, (_, offset) =>
        new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" }).format(
          new Date(Date.UTC(2026, 7, 2 + firstDay + offset)),
        ),
      );

      render(
        <FormattingProvider locale={locale} uiLocale={uiLocale}>
          <DatePickerInput value="2026-08-18" onChange={vi.fn()} />
        </FormattingProvider>,
      );

      await user.click(screen.getByRole("button", { name: /Pick a date/ }));

      const heading = await screen.findByText(expectedHeading);
      expect(heading).toHaveAttribute("aria-hidden", "true");
      expect(
        screen.getAllByRole("columnheader", { hidden: true }).map((header) => header.textContent),
      ).toEqual(expectedWeekDays);
    },
  );
});
