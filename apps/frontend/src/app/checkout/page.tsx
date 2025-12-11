"use client"
import { Card, CardBody, CardHeader } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { useTRPC } from '@/src/utils/trpc';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PaymentProviderEnum, PaymentStatusEnum } from '@repo/shared';
import { formatPrice } from '@/src/utils/format-price';
import { useState, useEffect } from 'react';

// Mock QR Code Generator (in production, use qrcode.react or similar)
const MockQRCode = ({ value, size = 200 }: { value: string; size?: number }) => {
    return (
        <div
            className="bg-white border-4 border-gray-300 flex items-center justify-center rounded-lg"
            style={{ width: `${size}px`, height: `${size}px` }}
        >
            <div className="text-center">
                <svg
                    className="w-16 h-16 mx-auto mb-2 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" />
                </svg>
                <p className="text-xs text-gray-500 break-all px-2">{value.slice(0, 20)}...</p>
            </div>
        </div>
    );
};

// Payment Method SVG Indicators
const PaymentMethodIndicator = ({ provider }: { provider: PaymentProviderEnum }) => {
    switch (provider) {
        // i ran out of time, i had to vibe, what the hell are these svgs bro 😭
        case PaymentProviderEnum.MOMO:
            return (
                <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-text">Momo Wallet</p>
                </div>
            );
        case PaymentProviderEnum.STRIPE:
            return (
                <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13.6 5.4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM17 12.6H7v-2h10v2zm-5-4c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-text">Stripe Card</p>
                </div>
            );
        case PaymentProviderEnum.BANK:
            return (
                <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-text">Bank Transfer</p>
                </div>
            );
        default:
            return null;
    }
};

export default function PaymentPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const trpc = useTRPC();

    const token = searchParams.get('token');
    const bookingLookUpCode = searchParams.get('bookingLookUpCode');
    const phoneNumber = searchParams.get('phoneNumber');

    if (!token || !token.trim().length || !bookingLookUpCode || !bookingLookUpCode.trim().length || !phoneNumber || !phoneNumber.trim().length) {
        return <>401</>;
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
    const [timeRemaining, setTimeRemaining] = useState<number>(0);

    // Calculate initial time remaining when booking data loads
    useEffect(() => {
        if (bookingQuery.data?.expiresAt) {
            const expiresAt = new Date(bookingQuery.data.expiresAt);
            const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
            setTimeRemaining(remaining);
        }
    }, [bookingQuery.data?.expiresAt]);

    // Update timer every second
    useEffect(() => {
        if (timeRemaining <= 0) return;

        const interval = setInterval(() => {
            setTimeRemaining((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, [timeRemaining]);

    const confirmMutationOptions = trpc.booking.confirmBooking.mutationOptions();
    const confirmMutation = useMutation({
        ...confirmMutationOptions,
        onSuccess(data) {
            setConfirmError(null);
            router.push(`/ticket?lookUpCode=${data.booking.lookupCode}&phoneNumber=${data.booking.phone}`);
        },
        onError(error: any) {
            const errorMessage = error?.message || error?.data?.message || 'Payment confirmation failed. Please try again.';
            setConfirmError(errorMessage);
            console.log(error);
        },
    });

    const handleConfirmPayment = () => {
        confirmMutation.mutate({ token });
    };

    if (bookingQuery.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardBody className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
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

                {/* QR Code & Payment Method */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* QR Code Section */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg text-text font-semibold">Scan to Pay</h2>
                        </CardHeader>
                        <CardBody className="flex flex-col items-center gap-4">
                            <MockQRCode value={token} size={220} />
                            <p className="text-xs text-secondary-text dark:text-secondary-text text-center">
                                Scan this (mock) QR code with your {bookingData.payment.guestPaymentProvider} app to complete payment
                            </p>
                        </CardBody>
                    </Card>

                    {/* Payment Method & Amount */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg text-text font-semibold">Payment Details</h2>
                        </CardHeader>
                        <CardBody className="flex flex-col gap-6">
                            {/* Payment Method Indicator */}
                            <div className="flex justify-center py-4 border-b border-border">
                                <PaymentMethodIndicator
                                    provider={bookingData.payment.guestPaymentProvider || PaymentProviderEnum.BANK}
                                />
                            </div>

                            {/* Amount */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-secondary-text dark:text-secondary-text">Total Amount</span>
                                    <span className="text-2xl font-bold text-accent">
                                        {formatPrice(bookingData.totalPrice)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-secondary-text dark:text-secondary-text">
                                    <span>Status</span>
                                    <span className="px-3 py-1 bg-warning dark:bg-warning text-text dark:text-text font-semibold rounded-full">
                                        {bookingData.payment.status}
                                    </span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Instruction Steps */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg text-text dark:text-text font-semibold">How to Complete Payment</h2>
                    </CardHeader>
                    <CardBody>
                        <ol className="space-y-2">
                            <li className="flex gap-4">
                                <span className="shrink-0 w-6 h-6 bg-accent text-text dark:text-text rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                <span className="text-sm text-text dark:text-text">Open your {bookingData.payment.guestPaymentProvider} app on your phone</span>
                            </li>
                            <li className="flex gap-4">
                                <span className="shrink-0 w-6 h-6 bg-accent text-text dark:text-text rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                <span className="text-sm text-text dark:text-text">Scan the QR code above or transfer {formatPrice(bookingData.totalPrice)}</span>
                            </li>
                            <li className="flex gap-4">
                                <span className="shrink-0 w-6 h-6 bg-accent text-text dark:text-text rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                <span className="text-sm text-text dark:text-text">Complete the transaction on your app</span>
                            </li>
                            <li className="flex gap-4">
                                <span className="shrink-0 w-6 h-6 bg-accent text-text dark:text-text rounded-full flex items-center justify-center text-xs font-bold">4</span>
                                <span className="text-sm text-text dark:text-text">Return here and click "Confirm Payment" below</span>
                            </li>
                        </ol>
                    </CardBody>
                </Card>

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

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <Button
                        onClick={() => router.push('/checkout/info')}
                        variant="secondary"
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmPayment}
                        variant="accent"
                        disabled={confirmMutation.isPending || isExpired}
                        className="flex-1"
                    >
                        {isExpired ? 'Payment Expired' : confirmMutation.isPending ? 'Confirming...' : 'Confirm Payment'}
                    </Button>
                </div>

                {/* Payment Info */}
                <Card className="">
                    <CardBody>
                        <p className="text-xs text-secondary-text dark:text-secondary-text">
                            <span className="font-semibold">Note:</span> This is a demo payment page. In production, you'll be redirected to your payment provider's app (Momo, Stripe, or Bank) to complete the transaction securely.
                        </p>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
