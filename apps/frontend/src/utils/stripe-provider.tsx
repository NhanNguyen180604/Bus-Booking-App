"use client";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

interface StripeProviderProps {
    children: React.ReactNode;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY as string);

export default function StripeProvider({ children }: StripeProviderProps) {
    return (
        <Elements
            options={{
                currency: 'vnd',
                loader: 'auto',
                appearance: {
                    theme: 'stripe',
                    variables: {
                        colorPrimary: 'hsl(var(--color-accent))',
                        colorBackground: 'hsl(var(--color-primary))',
                        colorText: 'hsl(var(--color-text))',
                        colorDanger: 'hsl(var(--color-danger))',
                        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        spacingUnit: '4px',
                        borderRadius: '8px',
                    },
                    rules: {
                        '.Input': {
                            boxShadow: 'none',
                            border: 'none',
                        },
                        '.Input:focus': {
                            border: 'none',
                            boxShadow: 'none',
                            outline: 'none',
                        },
                        '.Input--invalid': {
                            border: 'none',
                            boxShadow: 'none',
                        },
                    },
                },
            }}
            stripe={stripePromise}
        >
            {children}
        </Elements>
    )
}