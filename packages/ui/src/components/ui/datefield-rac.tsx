import { createCalendar } from "@internationalized/date";
import { useContext, useRef } from "react";
import { useDateField } from "react-aria";
import { useDateFieldState } from "react-stately";
import {
  composeRenderProps,
  DateFieldContext,
  DateFieldProps,
  DateField as DateFieldRac,
  DateFieldStateContext,
  DateInputProps as DateInputPropsRac,
  DateInput as DateInputRac,
  DateSegmentProps,
  DateSegment as DateSegmentRac,
  DateValue as DateValueRac,
  GroupContext,
  InputContext,
  Provider,
  TimeFieldProps,
  TimeField as TimeFieldRac,
  TimeFieldStateContext,
  TimeValue as TimeValueRac,
  useContextProps,
} from "react-aria-components";

import { useLocalizationSettings } from "../formatting-provider";
import { cn } from "../../lib/utils";

function DateField<T extends DateValueRac>({ className, children, ...props }: DateFieldProps<T>) {
  return (
    <DateFieldRac className={composeRenderProps(className, (className) => cn(className))} {...props}>
      {children}
    </DateFieldRac>
  );
}

function TimeField<T extends TimeValueRac>({ className, children, ...props }: TimeFieldProps<T>) {
  return (
    <TimeFieldRac className={composeRenderProps(className, (className) => cn(className))} {...props}>
      {children}
    </TimeFieldRac>
  );
}

function DateSegment({ className, ...props }: DateSegmentProps) {
  return (
    <DateSegmentRac
      className={composeRenderProps(className, (className) =>
        cn(
          "text-foreground data-focused:bg-primary data-focused:text-primary-foreground data-focused:data-placeholder:text-primary-foreground data-invalid:data-focused:bg-destructive data-invalid:data-focused:text-destructive-foreground data-invalid:data-focused:data-placeholder:text-destructive-foreground data-invalid:data-placeholder:text-destructive data-invalid:text-destructive data-placeholder:text-muted-foreground/70 data-[type=literal]:text-muted-foreground/70 outline-hidden data-disabled:cursor-not-allowed data-disabled:opacity-50 inline rounded p-0.5 caret-transparent data-[type=literal]:px-0",
          className,
        ),
      )}
      {...props}
    />
  );
}

const dateInputStyle =
  "relative inline-flex h-input-height w-full items-center overflow-hidden whitespace-nowrap rounded-md border border-input bg-input-bg dark:bg-input/30 px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none data-focus-within:border-ring data-focus-within:ring-ring/50 data-focus-within:ring-[3px] data-focus-within:has-aria-invalid:ring-destructive/20 dark:data-focus-within:has-aria-invalid:ring-destructive/40 data-focus-within:has-aria-invalid:border-destructive";

interface DateInputProps extends DateInputPropsRac {
  className?: string;
  unstyled?: boolean;
}

type DateInputComponentProps = Omit<DateInputProps, "children">;

function DateInput(props: DateInputComponentProps) {
  const dateFieldState = useContext(DateFieldStateContext);
  const timeFieldState = useContext(TimeFieldStateContext);

  return dateFieldState || timeFieldState ? <DateInputInner {...props} /> : <DateInputStandalone {...props} />;
}

function DateInputStandalone(props: DateInputComponentProps) {
  const { locale } = useLocalizationSettings();
  const [dateFieldProps, fieldRef] = useContextProps(
    { slot: props.slot } as DateFieldProps<DateValueRac>,
    undefined,
    DateFieldContext,
  );
  const state = useDateFieldState({
    ...dateFieldProps,
    locale,
    createCalendar,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const { fieldProps, inputProps } = useDateField({ ...dateFieldProps, inputRef }, state, fieldRef);

  return (
    <Provider
      values={[
        [DateFieldStateContext, state],
        [InputContext, { ...inputProps, ref: inputRef }],
        [
          GroupContext,
          {
            ...fieldProps,
            ref: fieldRef,
            isInvalid: state.isInvalid,
            isDisabled: state.isDisabled,
          },
        ],
      ]}
    >
      <DateInputInner {...props} />
    </Provider>
  );
}

function DateInputInner({ className, unstyled = false, ...props }: DateInputComponentProps) {
  return (
    <DateInputRac
      className={composeRenderProps(className, (className) => cn(!unstyled && dateInputStyle, className))}
      {...props}
    >
      {(segment) => <DateSegment segment={segment} className="px-2 py-1 ring-0" />}
    </DateInputRac>
  );
}

export { DateField, DateInput, DateSegment, TimeField, dateInputStyle };
export type { DateInputProps };
