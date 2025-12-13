"use client";;
import { Card, CardBody, CardHeader } from '@/src/components/ui/card';
import { FormField } from '@/src/components/ui/form-field';
import { useTRPC } from '@/src/utils/trpc';
import { useRouter } from 'next/navigation';
import PaymentMethodsCard from '@/src/components/booking/payment-methods-card';
import React, { useEffect, useRef } from 'react';
import { Button } from '@/src/components/ui/button';
import useUser from '@/src/hooks/useUser';
import { useForm } from 'react-hook-form';
import { BookingCreateOneDto, BookingCreateOneDtoType, PaymentProviderEnum } from '@repo/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterOutputsType } from 'backend';

type Trip = RouterOutputsType['trips']['findOneById'];
type Seat = RouterOutputsType["buses"]["getSeatsByBus"][number];

interface CheckoutInfoProps extends React.HTMLAttributes<HTMLDivElement> {
    trip: Trip;
    selectedSeats: Seat[];
    paymentFormRef: React.RefObject<HTMLDivElement | null>;
}

export default function CheckoutInfoComponent({ trip, selectedSeats, paymentFormRef, className = "" }: CheckoutInfoProps) {
    if (!trip)
        return null;

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
            tripId: trip.id,
            seatIds: selectedSeats.map(s => s.id),
            paymentProvider: PaymentProviderEnum.STRIPE,
        },
        mode: 'all',
    });

    useEffect(() => {
        setValue("seatIds", selectedSeats.map((s) => s.id), { shouldValidate: true });
    }, [selectedSeats]);

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
            const { booking, client_secret } = data;
            queryClient.setQueryData(trpc.booking.lookUpBooking.queryKey({ bookingCode: booking.lookupCode, phone: booking.phone }), booking);
            const oldBookedSeats = queryClient.getQueryData(trpc.booking.getBookingSeatsByTrip.queryKey({ tripId: trip.id }));
            queryClient.setQueryData(trpc.booking.getBookingSeatsByTrip.queryKey({ tripId: trip.id }), [...(oldBookedSeats ?? []), ...selectedSeats]);
            router.push(`/checkout?bookingLookUpCode=${booking.lookupCode}&phoneNumber=${booking.phone}&client_secret=${client_secret}`);
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
            paymentProvider,
        });
    };

    return (
        <div className={`${className} gap-x-4`} ref={paymentFormRef}>
            <form>
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
            </form>
        </div>
    );
}