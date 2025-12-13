"use client"
import { Card, CardBody, CardHeader } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { useTRPC } from '@/src/utils/trpc';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PaymentStatusEnum } from '@repo/shared';
import { formatPrice } from '@/src/utils/format-price';
import { useState, useEffect, FormEvent } from 'react';
import { useElements, useStripe } from '@stripe/react-stripe-js';
import {
    CardElement,
} from '@stripe/react-stripe-js';
import StripeProvider from '@/src/utils/stripe-provider';
import UnauthorizedPage from '@/src/components/status-pages/unauthorized-page';

export default function PaymentPageWrapper() {
    return (
        <StripeProvider>
            <PaymentPage />
        </StripeProvider>
    )
}

export function PaymentPage() {
    const stripe = useStripe();
    const stripeElements = useElements();

    const searchParams = useSearchParams();
    const router = useRouter();
    const trpc = useTRPC();

    const bookingLookUpCode = searchParams.get('bookingLookUpCode');
    const phoneNumber = searchParams.get('phoneNumber');
    const clientSecret = searchParams.get('client_secret');

    if (!bookingLookUpCode || !bookingLookUpCode.trim().length ||
        !phoneNumber || !phoneNumber.trim().length ||
        !clientSecret || !clientSecret.trim().length
    ) {
        return (
            <UnauthorizedPage />
        );
    }

    const bookingQueryOpts = trpc.booking.lookUpBooking.queryOptions({
        bookingCode: bookingLookUpCode!,
        phone: phoneNumber!,
    });
    const bookingQuery = useQuery({
        ...bookingQueryOpts,
        staleTime: 30 * 60 * 1000,
    });

    // this means the payment completed
    if (bookingQuery.data && bookingQuery.data.payment.status === PaymentStatusEnum.COMPLETED) {
        router.push(`/lookup?lookUpCode=${bookingQuery.data.lookupCode}&phoneNumber=${bookingQuery.data.phone}`);
        return;
    }

    const [confirmError, setConfirmError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);

    // Calculate initial time remaining when booking data loads
    useEffect(() => {
        if (bookingQuery.data?.expiresAt) {
            const expiresAt = new Date(bookingQuery.data.expiresAt);
            const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
            setTimeRemaining(remaining);
        }
    }, [bookingQuery.data?.expiresAt]);

    const getCssVar = (name: string) =>
        getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    // Update timer every second
    useEffect(() => {
        if (timeRemaining <= 0) return;

        const interval = setInterval(() => {
            setTimeRemaining((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, [timeRemaining]);

    if (bookingQuery.isLoading || !stripe || !stripeElements) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardBody className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                            <p className="text-text dark:text-text">Loading payment form...</p>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    if (bookingQuery.isError || !bookingQuery.data) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <h1 className="text-lg text-text font-bold">Error</h1>
                    </CardHeader>
                    <CardBody>
                        <p className="text-danger dark:text-danger mb-4">{bookingQuery.error?.message || 'Failed to load booking data'}</p>
                        <Button
                            onClick={() => router.push('/checkout/info')}
                            className="w-full"
                        >
                            Return
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    const bookingData = bookingQuery.data;

    const expiresAt = bookingData?.expiresAt ? new Date(bookingData.expiresAt) : null;
    const isExpired = timeRemaining <= 0 || (expiresAt ? new Date() > expiresAt : false);
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!stripe || !stripeElements) {
            setConfirmError('Stripe not loaded. Please refresh the page.');
            return;
        }

        setIsProcessing(true);
        setConfirmError(null);

        try {
            const cardEl = stripeElements.getElement(CardElement);

            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardEl!,
                    billing_details: {
                        name: bookingData.fullName,
                        email: bookingData.email && bookingData.email.trim().length ? bookingData.email.trim() : undefined,
                        phone: bookingData.phone,
                    },
                },
                receipt_email: bookingData.email && bookingData.email.trim().length ? bookingData.email.trim() : undefined,
            });

            if (error) {
                setConfirmError(error.message || 'Payment failed. Please try again.');
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                setConfirmError(null);
                router.push(`/ticket?lookUpCode=${bookingData.lookupCode}&phoneNumber=${bookingData.phone}`);
            } else {
                setConfirmError('Payment processing failed. Please try again.');
            }
        } catch (err) {
            setConfirmError('An unexpected error occurred. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <button
                onClick={() => {
                    if (window.history.state && window.history.state.idx > 0) {
                        router.back();
                    } else {
                        router.push('/checkout/info');
                    }
                }}
                className="flex items-center gap-2 text-accent hover:text-accent/80 mb-6 cursor-pointer"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                    <path d="m15 18-6-6 6-6" />
                </svg>
                Go back
            </button>

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <Card>
                    <CardHeader>
                        <h1 className="text-2xl text-text font-bold">Complete Your Payment</h1>
                        <p className="text-sm text-secondary-text dark:text-secondary-text mt-2">Booking Code: <span className="font-mono font-semibold text-accent">{bookingData.lookupCode}</span></p>
                    </CardHeader>
                </Card>

                {/* Expiration Warning */}
                {!isExpired && (
                    <Card className={isExpired ? 'border-danger dark:border-danger bg-danger/20 dark:bg-danger/20' : ''}>
                        <CardBody>
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-accent shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-semibold text-text">
                                        Payment expires in: <span className="text-accent">{minutes}:{seconds.toString().padStart(2, '0')}</span>
                                    </p>
                                    <p className="text-xs text-secondary-text dark:text-secondary-text mt-1">Complete payment within 30 minutes to secure your booking</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Payment Form */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg text-text font-semibold">Secure Payment</h2>
                        <p className="text-sm text-secondary-text dark:text-secondary-text mt-1">
                            Enter your card details to complete the booking
                        </p>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Payment Summary */}
                            <div className="bg-primary dark:bg-primary border border-border dark:border-border rounded-lg p-4">
                                <div className="flex justify-between items-center pointer-events-none">
                                    <span className="text-sm text-text dark:text-text font-bold">TOTAL AMOUNT</span>
                                    <span className="text-xl font-bold text-accent">
                                        {formatPrice(bookingData.totalPrice)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-text dark:text-text">
                                    Card Information
                                </label>
                                <div className="rounded-lg p-4 bg-primary dark:bg-primary">
                                    <CardElement
                                        options={{
                                            style: {
                                                base: {
                                                    fontSize: '16px',
                                                    color: getCssVar('--color-text'),
                                                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                                    '::placeholder': {
                                                        color: getCssVar('--color-secondary-text'),
                                                    },
                                                },
                                                invalid: {
                                                    color: getCssVar('--color--danger'),
                                                },
                                            },
                                            hidePostalCode: true,
                                        }}
                                        className="w-full"
                                    />
                                </div>
                                <p className="text-xs text-secondary-text dark:text-secondary-text">
                                    Your card information is encrypted and secure
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    onClick={() => router.push('/checkout/info')}
                                    variant="secondary"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="accent"
                                    disabled={!stripe || isExpired || isProcessing}
                                    className="flex-1"
                                >
                                    {isProcessing ? (
                                        'Processing...'
                                    ) : isExpired ? (
                                        'Payment Expired'
                                    ) : (
                                        'Complete Payment'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardBody>
                </Card>

                {isExpired && (
                    <Card className="border-danger dark:border-danger bg-danger/20 dark:bg-danger/20">
                        <CardBody>
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-danger dark:text-danger shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-semibold text-danger dark:text-danger">Payment Expired</p>
                                    <p className="text-xs text-secondary-text dark:text-secondary-text mt-1">This booking link has expired. Please start a new booking.</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Error Message */}
                {confirmError && (
                    <Card className="border-danger dark:border-danger bg-danger/20 dark:bg-danger/20">
                        <CardBody>
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-danger dark:text-danger shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-danger dark:text-danger">Payment Confirmation Error</p>
                                    <p className="text-sm text-danger dark:text-danger mt-1">{confirmError}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Payment Info */}
                <Card className="">
                    <CardBody>
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="text-sm text-secondary-text dark:text-secondary-text">
                                    <span className="font-semibold text-accent">Secure Payment</span> - Your card details are processed securely by Stripe and are not stored on our servers.
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
