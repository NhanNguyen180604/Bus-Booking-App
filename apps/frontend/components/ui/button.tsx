import { tv, type VariantProps } from "tailwind-variants";
import { forwardRef, ButtonHTMLAttributes } from "react";

const buttonStyles = tv({
  base: "inline-flex items-center justify-center rounded-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  variants: {
    variant: {
      primary: "bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500",
      secondary: "border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:ring-zinc-500",
      ghost: "text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:ring-zinc-500",
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
