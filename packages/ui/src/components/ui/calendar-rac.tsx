import { ComponentPropsWithoutRef, forwardRef, useContext } from "react";
import { I18nProvider } from "@react-aria/i18n";
import { filterDOMProps } from "@react-aria/utils";
import { createCalendar, getLocalTimeZone, today } from "@internationalized/date";
import { useCalendar, useRangeCalendar, mergeProps } from "react-aria";
import { useCalendarState, useRangeCalendarState } from "react-stately";
import { useTranslation } from "react-i18next";
import { Icons } from "./icons";
import {
  Button,
  ButtonContext,
  CalendarCell as CalendarCellRac,
  CalendarGridBody as CalendarGridBodyRac,
  CalendarGridHeader as CalendarGridHeaderRac,
  CalendarGrid as CalendarGridRac,
  CalendarHeaderCell as CalendarHeaderCellRac,
  Calendar as CalendarRac,
  CalendarContext,
  CalendarStateContext,
  Provider,
  RangeCalendar as RangeCalendarRac,
  RangeCalendarContext,
  RangeCalendarStateContext,
  TextContext,
  useContextProps,
  useRenderProps,
  VisuallyHidden,
} from "react-aria-components";

import { useDateFormatting, useLocalizationSettings, useNumberFormatting } from "../formatting-provider";
import { cn } from "../../lib/utils";

type CalendarProps = Omit<ComponentPropsWithoutRef<typeof CalendarRac>, "children" | "render">;
type RangeCalendarProps = Omit<ComponentPropsWithoutRef<typeof RangeCalendarRac>, "children" | "render">;

function CalendarHeading() {
  const calendarState = useContext(CalendarStateContext);
  const rangeCalendarState = useContext(RangeCalendarStateContext);
  const state = calendarState ?? rangeCalendarState;
  const formatting = useDateFormatting();

  if (!state) return null;

  const { start, end } = state.visibleRange;
  const title =
    start.era === end.era && start.year === end.year && start.month === end.month
      ? formatting.formatCalendarDate(start, { month: "long", year: "numeric" })
      : formatting.formatCalendarDateRange(start, end, { month: "long", year: "numeric" });

  return (
    <h2 aria-hidden="true" className="grow text-center text-sm font-medium">
      {title}
    </h2>
  );
}

function CalendarHeader() {
  const { t } = useTranslation();
  return (
    <header className="flex w-full items-center gap-1 pb-1">
      <Button
        slot="previous"
        aria-label={t("ui:datePicker.previousMonth", "Previous month")}
        className="text-muted-foreground/80 hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 flex size-9 items-center justify-center rounded-md outline-none transition-[color,box-shadow] focus-visible:ring-[3px]"
      >
        <Icons.ChevronLeft size={16} />
      </Button>
      <CalendarHeading />
      <Button
        slot="next"
        aria-label={t("ui:datePicker.nextMonth", "Next month")}
        className="text-muted-foreground/80 hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 flex size-9 items-center justify-center rounded-md outline-none transition-[color,box-shadow] focus-visible:ring-[3px]"
      >
        <Icons.ChevronRight size={16} />
      </Button>
    </header>
  );
}

function CalendarGridComponent({ isRange = false }: { isRange?: boolean }) {
  const now = today(getLocalTimeZone());
  const { locale, interfaceLocale } = useLocalizationSettings();
  const numberFormatting = useNumberFormatting();

  return (
    <I18nProvider locale={locale}>
      <CalendarGridRac>
        <CalendarGridHeaderRac>
          {(day) => (
            <CalendarHeaderCellRac className="text-muted-foreground/80 size-9 rounded-md p-0 text-xs font-medium">
              {day}
            </CalendarHeaderCellRac>
          )}
        </CalendarGridHeaderRac>
        <CalendarGridBodyRac className="[&_td]:px-0 [&_td]:py-px">
          {(date) => (
            <I18nProvider locale={interfaceLocale}>
              <CalendarCellRac date={date}>
                {/* Checks if date is outside currently displaying month and grays out */}
                {({ isOutsideMonth }) =>
                  isOutsideMonth ? (
                    <div
                      className={cn(
                        "data-hovered:bg-accent data-selected:bg-primary data-hovered:text-foreground data-selected:text-primary-foreground data-focus-visible:ring-ring/50 text-secondary data-disabled:pointer-events-none data-disabled:opacity-30 data-focus-visible:z-10 data-focus-visible:ring-[3px] data-unavailable:pointer-events-none data-unavailable:line-through data-unavailable:opacity-30 relative flex size-9 cursor-default items-center justify-center whitespace-nowrap rounded-md p-0 text-sm font-normal outline-none",
                      )}
                    >
                      {numberFormatting.formatDecimal(date.day, { useGrouping: false })}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "data-hovered:bg-accent data-selected:bg-primary data-hovered:text-foreground data-selected:text-primary-foreground data-focus-visible:ring-ring/50 text-foreground hover:bg-secondary data-disabled:pointer-events-none data-disabled:opacity-30 data-focus-visible:z-10 data-focus-visible:ring-[3px] data-unavailable:pointer-events-none data-unavailable:line-through data-unavailable:opacity-30 relative flex size-9 items-center justify-center whitespace-nowrap rounded-md p-0 text-sm font-normal outline-none transition-colors duration-150",
                        isRange &&
                          "data-selected:bg-accent data-selected:text-foreground data-invalid:data-selection-end:bg-destructive data-invalid:data-selection-start:bg-destructive data-selection-end:bg-primary data-selection-start:bg-primary data-selection-end:text-primary-foreground data-selection-start:text-primary-foreground data-invalid:bg-red-100 data-selected:rounded-none data-selection-end:rounded-e-md data-invalid:data-selection-end:text-white data-selection-start:rounded-s-md data-invalid:data-selection-start:text-white",
                        date.compare(now) === 0 &&
                          cn(
                            "after:bg-primary after:pointer-events-none after:absolute after:bottom-1 after:start-1/2 after:z-10 after:size-[3px] after:-translate-x-1/2 after:rounded-full",
                            isRange
                              ? "data-selection-end:after:bg-background data-selection-start:after:bg-background"
                              : "data-selected:after:bg-background",
                          ),
                      )}
                    >
                      {numberFormatting.formatDecimal(date.day, { useGrouping: false })}
                    </div>
                  )
                }
              </CalendarCellRac>
            </I18nProvider>
          )}
        </CalendarGridBodyRac>
      </CalendarGridRac>
    </I18nProvider>
  );
}

const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calendar({ className, ...props }, forwardedRef) {
  const { locale } = useLocalizationSettings();
  const [calendarProps, ref] = useContextProps({ ...props, className }, forwardedRef, CalendarContext);
  const state = useCalendarState({
    ...calendarProps,
    locale,
    createCalendar: calendarProps.createCalendar ?? createCalendar,
  });
  const {
    calendarProps: ariaProps,
    prevButtonProps,
    nextButtonProps,
    errorMessageProps,
  } = useCalendar(calendarProps, state);
  const renderProps = useRenderProps({
    ...calendarProps,
    values: {
      state,
      isDisabled: calendarProps.isDisabled ?? false,
      isInvalid: state.isValueInvalid,
    },
    defaultClassName: "react-aria-Calendar",
  });
  const DOMProps = filterDOMProps(calendarProps, { global: true });

  return (
    <div
      {...mergeProps(DOMProps, ariaProps)}
      ref={ref}
      slot={calendarProps.slot ?? undefined}
      className={cn("w-fit", renderProps.className)}
      style={renderProps.style}
      data-disabled={calendarProps.isDisabled || undefined}
      data-invalid={state.isValueInvalid || undefined}
    >
      <Provider
        values={[
          [ButtonContext, { slots: { previous: prevButtonProps, next: nextButtonProps } }],
          [CalendarStateContext, state],
          [CalendarContext, calendarProps],
          [TextContext, { slots: { errorMessage: errorMessageProps } }],
        ]}
      >
        <VisuallyHidden>
          <h2>{ariaProps["aria-label"]}</h2>
        </VisuallyHidden>
        <CalendarHeader />
        <CalendarGridComponent />
        <VisuallyHidden>
          <button
            aria-label={nextButtonProps["aria-label"]}
            disabled={nextButtonProps.isDisabled}
            onClick={() => state.focusNextPage()}
            tabIndex={-1}
          />
        </VisuallyHidden>
      </Provider>
    </div>
  );
});

const RangeCalendar = forwardRef<HTMLDivElement, RangeCalendarProps>(function RangeCalendar(
  { className, ...props },
  forwardedRef,
) {
  const { locale } = useLocalizationSettings();
  const [calendarProps, ref] = useContextProps({ ...props, className }, forwardedRef, RangeCalendarContext);
  const state = useRangeCalendarState({
    ...calendarProps,
    locale,
    createCalendar: calendarProps.createCalendar ?? createCalendar,
  });
  const {
    calendarProps: ariaProps,
    prevButtonProps,
    nextButtonProps,
    errorMessageProps,
  } = useRangeCalendar(calendarProps, state, ref);
  const renderProps = useRenderProps({
    ...calendarProps,
    values: {
      state,
      isDisabled: calendarProps.isDisabled ?? false,
      isInvalid: state.isValueInvalid,
    },
    defaultClassName: "react-aria-RangeCalendar",
  });
  const DOMProps = filterDOMProps(calendarProps, { global: true });

  return (
    <div
      {...mergeProps(DOMProps, ariaProps)}
      ref={ref}
      slot={calendarProps.slot ?? undefined}
      className={cn("w-fit", renderProps.className)}
      style={renderProps.style}
      data-disabled={calendarProps.isDisabled || undefined}
      data-invalid={state.isValueInvalid || undefined}
    >
      <Provider
        values={[
          [ButtonContext, { slots: { previous: prevButtonProps, next: nextButtonProps } }],
          [RangeCalendarStateContext, state],
          [RangeCalendarContext, calendarProps],
          [TextContext, { slots: { errorMessage: errorMessageProps } }],
        ]}
      >
        <VisuallyHidden>
          <h2>{ariaProps["aria-label"]}</h2>
        </VisuallyHidden>
        <CalendarHeader />
        <CalendarGridComponent isRange />
        <VisuallyHidden>
          <button
            aria-label={nextButtonProps["aria-label"]}
            disabled={nextButtonProps.isDisabled}
            onClick={() => state.focusNextPage()}
            tabIndex={-1}
          />
        </VisuallyHidden>
      </Provider>
    </div>
  );
});

export { Calendar, RangeCalendar };
