"use client";
import { Card, CardBody, CardHeader } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { FormField } from '@/src/components/ui/form-field';
import { useTRPC } from '@/src/utils/trpc';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { BookingLookUpDto, BookingLookUpDtoType } from '@repo/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '@/src/utils/format-price';
import { formatVNWithAMPM } from '@/src/utils/format-time';

export default function LookupPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const phoneParam = searchParams.get('phoneNumber');
    const bookingCodeParam = searchParams.get('lookUpCode');

    const bookingDetailsRef = useRef<HTMLDivElement>(null);

    const {
        register,
        formState: { errors: formErrors, isValid },
        handleSubmit,
        setValue,
        watch,
    } = useForm<BookingLookUpDtoType>({
        resolver: zodResolver(BookingLookUpDto),
        mode: 'all',
        defaultValues: {
            bookingCode: bookingCodeParam || '',
            phone: phoneParam || '',
        }
    });

    // Auto-fill form if params are provided
    useEffect(() => {
        if (phoneParam) setValue('phone', phoneParam, { shouldValidate: true });
        if (bookingCodeParam) setValue('bookingCode', bookingCodeParam, { shouldValidate: true });
        if (phoneParam || bookingCodeParam)
            queryClient.invalidateQueries({ queryKey: trpc.booking.lookUpBooking.queryKey() });
    }, [phoneParam, bookingCodeParam, setValue]);

    // Auto-fetch if both params are provided
    const shouldFetch = phoneParam && bookingCodeParam && phoneParam.trim().length > 0 && bookingCodeParam.trim().length > 0;

    const [bookingLookUpQueryObj, setBookingLookUpQueryObj] = useState<BookingLookUpDtoType>({
        bookingCode: bookingCodeParam || '',
        phone: phoneParam || '',
    });
    const bookingQueryOpts = trpc.booking.lookUpBooking.queryOptions({
        ...bookingLookUpQueryObj
    });

    const bookingQuery = useQuery({
        ...bookingQueryOpts,
        enabled: !!shouldFetch,
        staleTime: 60 * 60 * 1000,
        retry: false,
    });

    const onSubmit = (data: BookingLookUpDtoType) => {
        // Use the query to fetch with the form data
        setBookingLookUpQueryObj(data);
        bookingQuery.refetch();
    };

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <button
                onClick={() => {
                    if (window.history.state && window.history.state.idx > 0) {
                        router.back();
                    } else {
                        router.push('/');
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
                <Card ref={bookingDetailsRef}>
                    <CardHeader>
                        <h1 className="text-2xl text-text font-bold">Lookup Your Booking</h1>
                        <p className="text-sm text-secondary-text dark:text-secondary-text mt-2">Enter your phone number and booking code to view your booking details</p>
                    </CardHeader>
                </Card>

                {/* Search Form */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg text-text font-semibold">Booking Information</h2>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                label="Phone Number"
                                placeholder="Your phone number"
                                required
                                {...register('phone')}
                                error={formErrors.phone?.message}
                            />
                            <FormField
                                label="Booking Code"
                                placeholder="Your booking code (e.g., BK123ABC)"
                                required
                                {...register('bookingCode')}
                                error={formErrors.bookingCode?.message}
                            />

                            <Button
                                type="submit"
                                variant="accent"
                                className="w-full"
                                disabled={!isValid || bookingQuery.isLoading}
                            >
                                {bookingQuery.isLoading ? 'Searching...' : 'Search Booking'}
                            </Button>
                        </form>
                    </CardBody>
                </Card>

                {/* Loading State */}
                {bookingQuery.isLoading && (
                    <Card>
                        <CardBody className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                        </CardBody>
                    </Card>
                )}

                {/* Error State */}
                {bookingQuery.isError && (
                    <Card className="border-danger">
                        <CardBody>
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-danger shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-danger">Booking Not Found</p>
                                    <p className="text-sm text-danger mt-1">
                                        {bookingQuery.error?.message || 'No booking found with the provided information. Please check your phone number and booking code.'}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Booking Details */}
                {bookingQuery.data && (
                    <>
                        {/* Success Message */}
                        <Card className="border-success bg-success/10 dark:bg-success/10">
                            <CardBody>
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-success shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm font-semibold text-success">Booking Found</p>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Booking Summary */}
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg text-text dark:text-text font-semibold">Booking Details</h2>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-secondary-text dark:text-secondary-text uppercase font-semibold">Booking Code</p>
                                        <p className="text-lg font-mono font-bold text-accent mt-1">{bookingQuery.data.lookupCode}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-secondary-text dark:text-secondary-text uppercase font-semibold">Booking ID</p>
                                        <p className="text-lg font-mono font-bold text-text mt-1">{bookingQuery.data.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-secondary-text dark:text-secondary-text uppercase font-semibold">Full Name</p>
                                        <p className="text-lg font-semibold text-text mt-1">{bookingQuery.data.fullName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-secondary-text dark:text-secondary-text uppercase font-semibold">Phone Number</p>
                                        <p className="text-lg font-semibold text-text mt-1">{bookingQuery.data.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-secondary-text dark:text-secondary-text uppercase font-semibold">Email</p>
                                        <p className="text-lg font-semibold text-text mt-1">{bookingQuery.data.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-secondary-text dark:text-secondary-text uppercase font-semibold">Total Price</p>
                                        <p className="text-lg font-bold text-accent dark:text-accent mt-1">{formatPrice(bookingQuery.data.totalPrice)}</p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Trip Information */}
                        {bookingQuery.data.trip && (
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg text-text font-semibold">Trip Information</h2>
                                </CardHeader>
                                <CardBody className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-secondary-text dark:text-secondary-text uppercase font-semibold">From</p>
                                            <p className="text-lg font-semibold text-text mt-1">{bookingQuery.data.trip.route?.origin?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-secondary-text dark:text-secondary-text uppercase font-semibold">To</p>
                                            <p className="text-lg font-semibold text-text mt-1">{bookingQuery.data.trip.route?.destination?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-secondary-text dark:text-secondary-text uppercase font-semibold">Departure</p>
                                            <p className="text-lg font-semibold text-text mt-1">
                                                {formatVNWithAMPM(new Date(bookingQuery.data.trip.departureTime))}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-secondary-text dark:text-secondary-text uppercase font-semibold">Bus Number</p>
                                            <p className="text-lg font-semibold text-text mt-1">{bookingQuery.data.trip.bus?.plateNumber || 'N/A'}</p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        )}

                        {/* Seats Information */}
                        {bookingQuery.data.seats && bookingQuery.data.seats.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg text-text font-semibold">Booked Seats</h2>
                                </CardHeader>
                                <CardBody>
                                    <div className="flex flex-wrap gap-2">
                                        {bookingQuery.data?.seats.map((seat) => (
                                            <span key={seat.id}
                                                className='px-3 py-1 bg-accent/10 dark:bg-accent/10 text-accent dark:text-accent rounded-full text-sm font-medium'
                                            >
                                                {seat.code}
                                            </span>
                                        ))}
                                    </div>
                                </CardBody>
                            </Card>
                        )}

                        {/* Payment Information */}
                        {bookingQuery.data.payment && (
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg text-text font-semibold">Payment Status</h2>
                                </CardHeader>
                                <CardBody className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-secondary-text dark:text-secondary-text">Status</span>
                                        <span className={`px-3 py-1 rounded-full font-semibold text-sm ${bookingQuery.data.payment.status === 'COMPLETED'
                                            ? 'bg-success/20 text-success'
                                            : 'bg-warning/20 text-warning'
                                            }`}>
                                            {bookingQuery.data.payment.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-secondary-text dark:text-secondary-text">Amount</span>
                                        <span className="font-bold text-accent">{formatPrice(bookingQuery.data.payment.amount)}</span>
                                    </div>
                                    {bookingQuery.data.payment.isGuestPayment && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-secondary-text dark:text-secondary-text">Payment Method</span>
                                            <span className="font-semibold text-text">{bookingQuery.data.payment.guestPaymentProvider || 'N/A'}</span>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        )}

                        {/* Booking Expiration */}
                        {bookingQuery.data.expiresAt && (
                            <Card className="border-warning">
                                <CardBody>
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-warning shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-semibold text-warning">Booking Expires</p>
                                            <p className="text-sm text-warning mt-1">
                                                {new Date(bookingQuery.data.expiresAt).toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        )}
                    </>
                )}

                {/* Empty State */}
                {!bookingQuery.isLoading && !bookingQuery.data && !bookingQuery.isError && (
                    <Card className="text-center">
                        <CardBody className="py-12">
                            <svg className="w-16 h-16 mx-auto text-secondary-text dark:secondary-text mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-secondary-text dark:text-secondary-text mt-2">Enter your phone number and booking code to search for your booking</p>
                        </CardBody>
                    </Card>
                )}
            </div>
        </div>
    );
}
