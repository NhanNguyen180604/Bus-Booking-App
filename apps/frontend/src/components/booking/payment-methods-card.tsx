"use client"
import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardHeader, CardBody } from "../ui/card";
import { FormField } from "../ui/form-field";
import { PaymentProviderEnum } from "@repo/shared";

interface PaymentMethodsCardProps {
    onPaymentConfirmClick: (provider: PaymentProviderEnum) => void;
    onCancelClick: () => void;
    isLoading?: boolean;
    confirmPaymentBtnDisabled?: boolean;
    ref?: React.Ref<HTMLDivElement>;
}

export default function PaymentMethodsCard({ onPaymentConfirmClick, onCancelClick, isLoading = false, confirmPaymentBtnDisabled = false, ref }: PaymentMethodsCardProps) {
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentProviderEnum>(PaymentProviderEnum.MOMO);

    return (
        <>
            <Card ref={ref}>
                <CardHeader>
                    <h3 className='text-lg font-semibold text-text'>Payment Method</h3>
                </CardHeader>

                <CardBody>
                    <div className='space-y-4'>
                        {/* Momo Payment Option */}
                        <div
                            onClick={() => setSelectedPaymentMethod(PaymentProviderEnum.MOMO)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === PaymentProviderEnum.MOMO
                                ? 'border-accent dark:border-accent bg-accent/5 dark:bg-accent/10'
                                : 'border-border dark:border-border hover:border-border/80 dark:hover:border-border/80'
                                }`}
                        >
                            <div className='flex items-center gap-3'>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === PaymentProviderEnum.MOMO
                                    ? 'border-accent dark:border-accent bg-accent dark:bg-accent'
                                    : 'border-border dark:border-border'
                                    }`}>
                                    {selectedPaymentMethod === PaymentProviderEnum.MOMO && (
                                        <div className='w-2 h-2 bg-white dark:bg-white rounded-full' />
                                    )}
                                </div>
                                <div className='flex-1'>
                                    <h4 className='text-text dark:text-text font-semibold'>Momo Wallet</h4>
                                    <p className='text-sm text-secondary-text dark:text-secondary-text'>Fast and secure payment via Momo app</p>
                                </div>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className='text-accent dark:text-accent opacity-20'
                                >
                                    <rect width="24" height="24" rx="6" fill="currentColor" />
                                    <circle cx="12" cy="12" r="4" fill="white" />
                                </svg>
                            </div>
                        </div>

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
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className='text-blue-500 dark:text-blue-400 opacity-20'
                                >
                                    <rect width="24" height="24" rx="3" />
                                    <rect y="10" width="24" height="8" fill="currentColor" opacity="0.5" />
                                </svg>
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
                        {selectedPaymentMethod === PaymentProviderEnum.MOMO && (
                            <div className='space-y-2'>
                                <h5 className='font-semibold text-text dark:text-text'>Momo Payment Details</h5>
                                <p className='text-sm text-secondary-text dark:text-secondary-text'>
                                    You will be redirected to Momo app to complete the payment. Make sure you have Momo app installed and sufficient balance.
                                </p>
                            </div>
                        )}

                        {selectedPaymentMethod === PaymentProviderEnum.STRIPE && (
                            <div className='space-y-2'>
                                <h5 className='font-semibold text-text dark:text-text'>Credit Card Payment Details</h5>
                                <p className='text-sm text-secondary-text dark:text-secondary-text'>
                                    Enter your card details to complete payment. Stripe ensures your payment information is secure.
                                </p>
                                <div className='mt-3 space-y-3'>
                                    <FormField label='Card Number' placeholder='1234 5678 9012 3456' required />
                                    <div className='grid grid-cols-2 gap-3'>
                                        <FormField label='Expiry Date' placeholder='MM/YY' required />
                                        <FormField label='CVC' placeholder='123' required />
                                    </div>
                                    <FormField label='Cardholder Name' required />
                                </div>
                            </div>
                        )}

                        {selectedPaymentMethod === PaymentProviderEnum.BANK && (
                            <div className='space-y-2'>
                                <h5 className='font-semibold text-text dark:text-text'>Bank Transfer Details</h5>
                                <p className='text-sm text-secondary-text dark:text-secondary-text'>
                                    Transfer the amount to the following bank account. Please use your booking ID as reference.
                                </p>
                                <div className='mt-4 space-y-3 p-3 bg-accent/5 dark:bg-accent/10 rounded border border-accent/20 dark:border-accent/20'>
                                    <div className='flex justify-between'>
                                        <span className='text-secondary-text dark:text-secondary-text text-sm'>Bank Name:</span>
                                        <span className='text-text dark:text-text font-medium'>Vietcombank</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-secondary-text dark:text-secondary-text text-sm'>Account Number:</span>
                                        <span className='text-text dark:text-text font-medium'>Fake Number</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-secondary-text dark:text-secondary-text text-sm'>Account Holder:</span>
                                        <span className='text-text dark:text-text font-medium'>Bus Booking Co., Ltd</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        <span className='text-secondary-text dark:text-secondary-text text-sm'>Reference:</span>
                                        <span className='text-text dark:text-text font-medium'>Fake Reference</span>
                                    </div>
                                </div>
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