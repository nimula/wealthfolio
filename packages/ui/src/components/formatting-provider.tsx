import * as React from "react";
import { I18nProvider } from "@react-aria/i18n";
import {
  createAmountFormatting,
  createDateFormatting,
  createNumberFormatting,
  type AmountFormatting,
  type DateFormatting,
  type NumberFormatting,
  resolveFormattingLocale,
} from "../lib/formatting";

export interface LocalizationSettings {
  locale: string;
  uiLocale: string;
  interfaceLocale: string;
  timezone?: string;
}

const DEFAULT_LOCALIZATION_SETTINGS: LocalizationSettings = {
  locale: "en-US",
  uiLocale: "en",
  interfaceLocale: "en",
};
const DEFAULT_AMOUNT_FORMATTING = createAmountFormatting(DEFAULT_LOCALIZATION_SETTINGS.locale);
const DEFAULT_NUMBER_FORMATTING = createNumberFormatting(DEFAULT_LOCALIZATION_SETTINGS.locale);
const DEFAULT_DATE_FORMATTING = createDateFormatting(DEFAULT_LOCALIZATION_SETTINGS.locale);

const LocalizationSettingsContext = React.createContext(DEFAULT_LOCALIZATION_SETTINGS);
const AmountFormattingContext = React.createContext(DEFAULT_AMOUNT_FORMATTING);
const NumberFormattingContext = React.createContext(DEFAULT_NUMBER_FORMATTING);
const DateFormattingContext = React.createContext(DEFAULT_DATE_FORMATTING);

function FormattingRuntime({ settings, children }: { settings: LocalizationSettings; children: React.ReactNode }) {
  const amountFormatting = React.useMemo<AmountFormatting>(
    () => createAmountFormatting(settings.locale),
    [settings.locale],
  );
  const numberFormatting = React.useMemo<NumberFormatting>(
    () => createNumberFormatting(settings.locale),
    [settings.locale],
  );
  const dateFormatting = React.useMemo<DateFormatting>(
    () => createDateFormatting(settings.locale, settings.timezone),
    [settings.locale, settings.timezone],
  );

  return (
    <AmountFormattingContext.Provider value={amountFormatting}>
      <NumberFormattingContext.Provider value={numberFormatting}>
        <DateFormattingContext.Provider value={dateFormatting}>{children}</DateFormattingContext.Provider>
      </NumberFormattingContext.Provider>
    </AmountFormattingContext.Provider>
  );
}

function resolveInterfaceLocale(uiLocale: string): string {
  const ui = new Intl.Locale(uiLocale);
  if (ui.language === "zh") {
    return ui.maximize().script === "Hant" ? "zh-TW" : "zh-CN";
  }

  return ui.toString();
}

export function FormattingProvider({
  locale,
  uiLocale = "en",
  timezone,
  children,
}: {
  locale: string;
  uiLocale?: string;
  timezone?: string;
  children: React.ReactNode;
}) {
  const resolvedLocale = resolveFormattingLocale(locale);
  const interfaceLocale = resolveInterfaceLocale(uiLocale);
  const settings = React.useMemo(
    () => ({ locale: resolvedLocale, uiLocale, interfaceLocale, timezone }),
    [resolvedLocale, uiLocale, interfaceLocale, timezone],
  );
  return (
    <I18nProvider locale={interfaceLocale}>
      <LocalizationSettingsContext.Provider value={settings}>
        <FormattingRuntime settings={settings}>{children}</FormattingRuntime>
      </LocalizationSettingsContext.Provider>
    </I18nProvider>
  );
}

export function useLocalizationSettings(): LocalizationSettings {
  return React.useContext(LocalizationSettingsContext);
}

export function useAmountFormatting(): AmountFormatting {
  return React.useContext(AmountFormattingContext);
}

export function useNumberFormatting(): NumberFormatting {
  return React.useContext(NumberFormattingContext);
}

export function useDateFormatting(): DateFormatting {
  return React.useContext(DateFormattingContext);
}
