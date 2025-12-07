"use client";;
import { Card, CardBody, CardHeader } from '@/src/components/ui/card';
import { FormField } from '@/src/components/ui/form-field';
import { useTRPC } from '@/src/utils/trpc';
import { useRouter } from 'next/navigation';
import BookingSummaryCard from '@/src/components/booking/booking-summary-card';
import PaymentMethodsCard from '@/src/components/booking/payment-methods-card';
import { useEffect, useRef } from 'react';
import { Button } from '@/src/components/ui/button';
import useUser from '@/src/hooks/useUser';
import { useForm } from 'react-hook-form';
import { BookingCreateOneDto, BookingCreateOneDtoType, PaymentProviderEnum } from '@repo/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function CheckoutInfoPage() {
    const mockTripId = `0d0f770a-602d-4cfb-9b7c-65ca41a95f2b`;
    const mockSeatIds = [
        `01e52c09-b6c3-4155-b8b8-243812031dc3`,
        `74e3587b-f374-4e87-b63c-f173579ea9bd`,
    ];

    const trpc = useTRPC();
    const router = useRouter();
    const paymentMethodsCardRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const {
        register,
        formState: { errors: formErrors, isValid },
        setError,
        setValue,
        watch,
    } = useForm<BookingCreateOneDtoType>({
        resolver: zodResolver(BookingCreateOneDto),
        defaultValues: {
            tripId: mockTripId,
            seatIds: mockSeatIds,
            // all guest for now
            paymentDetails: {
                isGuestPayment: true,
                guestPaymentProvider: PaymentProviderEnum.BANK,
            },
        },
        mode: 'all',
    });

    const createBookingMutationOptions = trpc.booking.createOne.mutationOptions();
    const createBookingMutation = useMutation({
        ...createBookingMutationOptions,
        onError(error: any) {
            if (error.data?.zodError) {
                // Handle Zod validation errors from backend
                const zodErrors = error.data.zodError.fieldErrors;
                zodErrors.forEach((fieldError: any) => {
                    setError(fieldError.path[0] as any, {
                        message: fieldError.message,
                    });
                });
            } else {
                setError("root", {
                    message: error.message || "Create booking failed. Please try again.",
                });
            }
        },
        onSuccess(data) {
            // Redirect to payment page with booking token
            queryClient.setQueryData(trpc.booking.lookUpBooking.queryKey({ bookingCode: data.lookupCode, phone: data.phone }), data);
            router.push(`/checkout/payment?token=${data.token}&bookingLookUpCode=${data.lookupCode}&phoneNumber=${data.phone}`);
        },
    });

    const userQuery = useUser();
    useEffect(() => {
        if (userQuery.isSuccess && userQuery.data) {
            setValue("fullName", userQuery.data.name, { shouldValidate: true });
            setValue("phone", userQuery.data.phone, { shouldValidate: true });
            setValue("email", userQuery.data.email, { shouldValidate: true });
        }
    }, [userQuery.isSuccess]);

    const handlePaymentConfirm = async (paymentProvider: PaymentProviderEnum) => {
        const formData = watch();
        createBookingMutation.mutate({
            ...formData,
            paymentDetails: {
                isGuestPayment: true,
                guestPaymentProvider: paymentProvider,
            },
        });
    };

    return (
        <form>
            <button
                onClick={() => {
                    if (window.history.state && window.history.state.idx > 0) {
                        router.back();
                    } else {
                        router.push('/');
                    }
                }}
                className="col-span-12 flex items-center gap-2 text-accent hover:text-accent/80 mb-6 cursor-pointer pt-8 pb-4"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                    <path d="m15 18-6-6 6-6" />
                </svg>
                Go back
            </button>

            <div className='gap-x-4 py-4 flex relative'>
                <div className='flex-2'>
                    <Card>
                        <CardHeader>
                            <h1 className='text-lg text-text font-bold'>Checkout Info</h1>
                        </CardHeader>

                        <CardBody>
                            <div className='flex flex-col gap-4'>
                                <FormField
                                    label='Full Name' required
                                    {...register('fullName')}
                                    placeholder='Your name'
                                    error={formErrors.fullName?.message}
                                />
                                <FormField
                                    label='Phone number' required
                                    {...register('phone')}
                                    placeholder='Your phone number'
                                    error={formErrors.phone?.message}
                                />
                                <FormField
                                    label='Email'
                                    {...register('email')}
                                    placeholder='Your email'
                                    error={formErrors.email?.message}
                                />

                                <Button variant='accent' className='mt-4'
                                    disabled={formErrors.fullName !== undefined || formErrors.phone !== undefined}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        paymentMethodsCardRef.current?.scrollIntoView({
                                            behavior: 'smooth'
                                        });
                                    }}>
                                    Continue
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    <div className="lg:hidden mt-4">
                        <BookingSummaryCard tripId={mockTripId} seatIds={mockSeatIds} />
                    </div>

                    <div className='mt-4'>
                        <PaymentMethodsCard ref={paymentMethodsCardRef}
                            onPaymentConfirmClick={handlePaymentConfirm}
                            isLoading={createBookingMutation.isPending}
                            confirmPaymentBtnDisabled={!isValid || createBookingMutation.isPending}
                            onCancelClick={() => {
                                if (window.history.state && window.history.state.idx > 0) {
                                    router.back();
                                } else {
                                    router.push('/');
                                }
                            }} />
                    </div>
                </div>

                <div className="flex-1 sticky top-20 h-fit hidden lg:block">
                    <BookingSummaryCard tripId={mockTripId} seatIds={mockSeatIds} />
                </div>
            </div>
        </form>
    );
}