import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const formFieldStyles = tv({
  slots: {
    container: "space-y-2",
    label: "block text-sm font-medium text-zinc-700 dark:text-zinc-300",
    input: "block w-full rounded-md border px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 transition-colors",
    helperText: "text-sm text-zinc-500 dark:text-zinc-400",
    errorText: "text-sm text-red-600 dark:text-red-400",
  },
  variants: {
    variant: {
      default: {
        input: "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 focus:border-blue-500 focus:ring-blue-500",
      },
      error: {
        input: "border-red-500 dark:border-red-500 bg-white dark:bg-zinc-700 focus:border-red-500 focus:ring-red-500",
      },
      success: {
        input: "border-green-500 dark:border-green-500 bg-white dark:bg-zinc-700 focus:border-green-500 focus:ring-green-500",
      },
    },
    size: {
      sm: {
        input: "h-9 px-2 py-1 text-sm",
      },
      md: {
        input: "h-10 px-3 py-2",
      },
      lg: {
        input: "h-12 px-4 py-3",
      },
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

export interface FormFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof formFieldStyles> {
  label?: string;
  helperText?: string;
  error?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      className,
      variant,
      size,
      label,
      helperText,
      error,
      startIcon,
      endIcon,
      id,
      ...props
    },
    ref
  ) => {
    const styles = formFieldStyles({
      variant: error ? "error" : variant,
      size,
    });
    const fieldId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={styles.container()}>
        {label && (
          <label htmlFor={fieldId} className={styles.label()}>
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {startIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              {startIcon}
            </div>
          )}
          <input
            ref={ref}
            id={fieldId}
            className={styles.input({
              className: `${startIcon ? "pl-10" : ""} ${endIcon ? "pr-10" : ""} ${className}`,
            })}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
              {endIcon}
            </div>
          )}
        </div>
        {error && <p className={styles.errorText()}>{error}</p>}
        {helperText && !error && (
          <p className={styles.helperText()}>{helperText}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
