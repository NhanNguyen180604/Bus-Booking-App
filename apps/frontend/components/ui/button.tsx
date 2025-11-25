import { tv, type VariantProps } from "tailwind-variants";
import { forwardRef, ButtonHTMLAttributes } from "react";

const buttonStyles = tv({
  base: "inline-flex items-center justify-center rounded-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer",
  variants: {
    variant: {
      primary: "bg-primary text-text hover:bg-primary/50 focus:ring-primary",
      secondary: "border border-border dark:border-border bg-secondary dark:bg-secondary text-text dark:text-text hover:bg-secondary/50 dark:hover:bg-secondary/50 focus:ring-secondary",
      success: "bg-success text-white hover:bg-success/50 focus:ring-success",
      danger: "bg-danger text-white hover:bg-danger/50 focus:ring-danger",
      warning: "bg-warning text-white hover:bg-warning/50 focus:ring-warning",
      accent: "bg-accent text-white hover:bg-accent/50 focus:ring-accent",
    },
    size: {
      sm: "h-9 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    },
    fullWidth: {
      true: "w-full",
      false: "",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
    fullWidth: false,
  },
});

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonStyles({ variant, size, fullWidth, className })}
        {...props}
      />
    );
  }
);

Button.displayName = "ButtonVariants";
