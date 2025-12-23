"use client";

import { tv } from "tailwind-variants";
import { Button } from "./button";

const iconStyles = tv({
    base: "shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
    variants: {
        variant: {
            danger: "bg-danger/20",
            accent: "bg-accent/20",
        },
    },
    defaultVariants: {
        variant: "danger",
    },
});

const iconColorStyles = tv({
    base: "w-6 h-6",
    variants: {
        variant: {
            danger: "text-danger",
            accent: "text-accent",
        },
    },
    defaultVariants: {
        variant: "danger",
    },
});

interface VariantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    isPending?: boolean;
    error?: string | null;
    variant?: "danger" | "accent";
    children?: React.ReactNode;
    showActions?: boolean;
    maxWidth?: "sm" | "md" | "lg" | "xl";
    icon?: React.ReactNode;
}

export function VariantModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isPending = false,
    error,
    variant = "danger",
    children,
    showActions = true,
    maxWidth = "md",
    icon,
}: VariantModalProps) {
    if (!isOpen) return null;

    const handleClose = () => {
        if (!isPending) {
            onClose();
        }
    };

    const maxWidthClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto"
            onClick={handleClose}
        >
            <div
                className={`bg-background rounded-lg p-6 ${maxWidthClasses[maxWidth]} w-full mx-4 my-8`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    {icon ? (
                        icon
                    ) : (
                        <div className={iconStyles({ variant })}>
                            <svg
                                className={iconColorStyles({ variant })}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                    )}
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-text">{title}</h3>
                        {description && (
                            <p className="text-sm text-secondary-text">{description}</p>
                        )}
                    </div>
                </div>

                {/* Content */}
                {children}

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                        <p className="text-sm text-danger">{error}</p>
                    </div>
                )}

                {/* Actions */}
                {showActions && onConfirm && (
                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="secondary"
                            onClick={handleClose}
                            disabled={isPending}
                        >
                            {cancelText}
                        </Button>
                        <Button
                            variant={variant}
                            onClick={onConfirm}
                            disabled={isPending}
                        >
                            {isPending ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Processing...
                                </>
                            ) : (
                                confirmText
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
