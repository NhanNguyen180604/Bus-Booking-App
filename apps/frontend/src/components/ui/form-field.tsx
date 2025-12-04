import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const formFieldStyles = tv({
  slots: {
    container: "space-y-2",
    label: "block text-base font-bold text-text dark:text-text",
    input: "block w-full rounded-md border px-3 py-2 text-text dark:text-text placeholder-secondary-text dark:placeholder-secondary-text focus:outline-none focus:ring-2 transition-colors",
    helperText: "text-sm text-secondary-text dark:text-secondary-text",
    errorText: "text-sm text-danger dark:text-danger",
  },
  variants: {
    variant: {
      default: {
        input: "border-border dark:border-border bg-primary dark:bg-primary focus:border-accent focus:ring-accent",
      },
      error: {
        input: "border-danger dark:border-danger bg-primary dark:bg-primary focus:border-danger focus:ring-danger",
      },
      success: {
        input: "border-success dark:border-success bg-primary dark:bg-primary focus:border-success focus:ring-success",
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
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {startIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text dark:text-secondary-text">
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
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text dark:text-secondary-text">
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
