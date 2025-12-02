import { tv, type VariantProps } from "tailwind-variants";
import { forwardRef, HTMLAttributes } from "react";

const cardStyles = tv({
  slots: {
    base: "rounded-lg border bg-secondary dark:bg-secondary shadow-sm overflow-hidden",
    header: "px-6 py-4 border-border dark:border-border",
    body: "px-6 py-4",
    footer: "px-6 py-4 border-border dark:border-border bg-secondary dark:bg-secondary",
  },
  variants: {
    variant: {
      default: {
        base: "border-border dark:border-border drop-shadow-drop-shadow-near drop-shadow-md",
      },
      elevated: {
        base: "border-transparent shadow-md",
      },
      outlined: {
        base: "border-2 border-zinc-300 dark:border-zinc-600 shadow-none",
      },
    },
    padding: {
      none: {
        body: "p-0",
      },
      sm: {
        header: "px-4 py-3",
        body: "px-4 py-3",
        footer: "px-4 py-3",
      },
      md: {
        header: "px-6 py-4",
        body: "px-6 py-4",
        footer: "px-6 py-4",
      },
      lg: {
        header: "px-8 py-6",
        body: "px-8 py-6",
        footer: "px-8 py-6",
      },
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "md",
  },
});

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardStyles> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, children, ...props }, ref) => {
    const styles = cardStyles({ variant, padding });
    return (
      <div ref={ref} className={styles.base({ className })} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { padding?: "none" | "sm" | "md" | "lg" }
>(({ className, padding = "md", children, ...props }, ref) => {
  const styles = cardStyles({ padding });
  return (
    <div ref={ref} className={styles.header({ className })} {...props}>
      {children}
    </div>
  );
});

CardHeader.displayName = "CardHeader";

export const CardBody = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { padding?: "none" | "sm" | "md" | "lg" }
>(({ className, padding = "md", children, ...props }, ref) => {
  const styles = cardStyles({ padding });
  return (
    <div ref={ref} className={styles.body({ className })} {...props}>
      {children}
    </div>
  );
});

CardBody.displayName = "CardBody";

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { padding?: "none" | "sm" | "md" | "lg" }
>(({ className, padding = "md", children, ...props }, ref) => {
  const styles = cardStyles({ padding });
  return (
    <div ref={ref} className={styles.footer({ className })} {...props}>
      {children}
    </div>
  );
});

CardFooter.displayName = "CardFooter";
