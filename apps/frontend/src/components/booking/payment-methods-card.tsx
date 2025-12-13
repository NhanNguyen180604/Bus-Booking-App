"use client"
import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardHeader, CardBody } from "../ui/card";
import { PaymentProviderEnum } from "@repo/shared";
import Image from "next/image";

interface PaymentMethodsCardProps {
    onPaymentConfirmClick: (provider: PaymentProviderEnum) => void;
    onCancelClick: () => void;
    isLoading?: boolean;
    confirmPaymentBtnDisabled?: boolean;
    ref?: React.Ref<HTMLDivElement>;
}

export default function PaymentMethodsCard({ onPaymentConfirmClick, onCancelClick, isLoading = false, confirmPaymentBtnDisabled = false, ref }: PaymentMethodsCardProps) {
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentProviderEnum>(PaymentProviderEnum.STRIPE);

    return (
        <>
            <Card ref={ref}>
                <CardHeader>
                    <h3 className='text-lg font-semibold text-text'>Payment Method</h3>
                </CardHeader>

                <CardBody>
                    <div className='space-y-4'>
                        {/* Stripe Payment Option */}
                        <div
                            onClick={() => setSelectedPaymentMethod(PaymentProviderEnum.STRIPE)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === PaymentProviderEnum.STRIPE
                                ? 'border-accent dark:border-accent bg-accent/5 dark:bg-accent/10'
                                : 'border-border dark:border-border hover:border-border/80 dark:hover:border-border/80'
                                }`}
                        >
                            <div className='flex items-center gap-3'>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === PaymentProviderEnum.STRIPE
                                    ? 'border-accent dark:border-accent bg-accent dark:bg-accent'
                                    : 'border-border dark:border-border'
                                    }`}>
                                    {selectedPaymentMethod === PaymentProviderEnum.STRIPE && (
                                        <div className='w-2 h-2 bg-white dark:bg-white rounded-full' />
                                    )}
                                </div>
                                <div className='flex-1'>
                                    <h4 className='text-text dark:text-text font-semibold'>Credit Card (Stripe)</h4>
                                    <p className='text-sm text-secondary-text dark:text-secondary-text'>Pay securely with your credit or debit card</p>
                                </div>

                                <Image width={32} height={32}
                                    src='/images/stripe-logo.png'
                                    alt="Stripe logo"
                                />
                            </div>
                        </div>

                        {/* Bank Transfer Payment Option */}
                        <div
                            onClick={() => setSelectedPaymentMethod(PaymentProviderEnum.BANK)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === PaymentProviderEnum.BANK
                                ? 'border-accent dark:border-accent bg-accent/5 dark:bg-accent/10'
                                : 'border-border dark:border-border hover:border-border/80 dark:hover:border-border/80'
                                }`}
                        >
                            <div className='flex items-center gap-3'>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === PaymentProviderEnum.BANK
                                    ? 'border-accent dark:border-accent bg-accent dark:bg-accent'
                                    : 'border-border dark:border-border'
                                    }`}>
                                    {selectedPaymentMethod === PaymentProviderEnum.BANK && (
                                        <div className='w-2 h-2 bg-white dark:bg-white rounded-full' />
                                    )}
                                </div>
                                <div className='flex-1'>
                                    <h4 className='text-text dark:text-text font-semibold'>Bank Transfer</h4>
                                    <p className='text-sm text-secondary-text dark:text-secondary-text'>Transfer directly from your bank account</p>
                                </div>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className='text-green-500 dark:text-green-400 opacity-20'
                                >
                                    <path d="M12 2L2 7v3h20V7l-10-5zm0 15H4v-3h16v3zm0 3H4v1h16v-1z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method Details */}
                    <div className='mt-6 p-4 bg-background dark:bg-background border border-border dark:border-border rounded-lg'>
                        {selectedPaymentMethod === PaymentProviderEnum.STRIPE && (
                            <div className='space-y-2'>
                                <p className='text-sm text-secondary-text dark:text-secondary-text'>
                                    Enter your card details to complete payment. Stripe ensures your payment information is secure.
                                </p>
                            </div>
                        )}

                        {selectedPaymentMethod === PaymentProviderEnum.BANK && (
                            <div className='space-y-2'>
                                <h5 className='font-semibold text-text dark:text-text'>Bank Transfer Details</h5>
                                <p className='text-sm text-secondary-text dark:text-secondary-text'>
                                    Transfer the amount to the following bank account. Please use your booking ID as reference.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className='mt-6 flex gap-3'>
                        <Button variant='primary' fullWidth onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onCancelClick();
                        }}>
                            Cancel
                        </Button>
                        <Button variant='accent' fullWidth
                            disabled={confirmPaymentBtnDisabled}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onPaymentConfirmClick(selectedPaymentMethod);
                            }}>
                            {isLoading ? 'Creating Booking...' : 'Create Booking'}
                        </Button>
                    </div>
                </CardBody>
            </Card>
        </>
    );
}