"use client";

import { Card, CardBody } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { useTRPC } from '@/src/utils/trpc';
import { useQuery, skipToken } from '@tanstack/react-query';
import { useState } from 'react';
import { formatPrice } from '@/src/utils/format-price';
import { formatVNWithAMPM } from '@/src/utils/format-time';
import useUser from '@/src/hooks/useUser';
import { useRouter } from 'next/navigation';
import Pagination from '@/src/components/ui/pagination';
import Loading from '@/src/components/ui/loading';
import { getStatusColor } from '@/src/utils/get-status-color';
import { PaymentStatusEnum, TripStatusEnum } from '@repo/shared';
import Link from 'next/link';

export default function TicketPage() {
    const router = useRouter();
    const trpc = useTRPC();
    const { data: user, isLoading: userLoading } = useUser();
    const [currentPage, setCurrentPage] = useState(1);

    // Skip the query if user is not loaded yet or not authenticated
    const bookingsQuery = useQuery({
        ...trpc.booking.userSearchBookings.queryOptions(
            user ? {
                page: currentPage,
                perPage: 10,
            } : skipToken
        ),
        staleTime: 5 * 60 * 1000,
    });

    if (userLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
        );
    }

    if (!user) {
        router.push('/ticket/guest');
        return null;
    }

    return (
        <div className="min-h-screen bg-background py-4 sm:py-8 px-4 lg:px-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold text-text mb-6 sm:mb-8">My Tickets</h1>
                {/* Booking History List */}
                <div className="space-y-4">
                    {bookingsQuery.isLoading && (
                        <Card>
                            <Loading />
                        </Card>
                    )}

                    {bookingsQuery.isError && (
                        <Card className="border-danger">
                            <CardBody>
                                <p className="text-danger text-center">
                                    {bookingsQuery.error?.message || 'Failed to load bookings'}
                                </p>
                            </CardBody>
                        </Card>
                    )}

                    {bookingsQuery.data && bookingsQuery.data.data.length === 0 && (
                        <Card>
                            <CardBody className="text-center py-12">
                                <svg className="w-16 h-16 mx-auto text-secondary-text mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <h3 className="text-lg font-semibold text-text mb-2">No bookings yet</h3>
                                <p className="text-secondary-text">Start booking your trips to see them here!</p>
                            </CardBody>
                        </Card>
                    )}

                    {bookingsQuery.data && bookingsQuery.data.data.length > 0 && (
                        <>
                            <div className="grid gap-4">
                                {bookingsQuery.data.data.map((booking) => (
                                    <Link href={`/ticket/details/${booking.id}`} key={booking.id}>
                                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                                            <CardBody>
                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap justify-between md:justify-start items-center gap-2 sm:gap-3 mb-3 sm:mb-2">
                                                            <h3 className="text-base sm:text-lg font-bold text-text">{booking.lookupCode}</h3>
                                                            {booking.payment.status !== PaymentStatusEnum.COMPLETED ? (
                                                                <p className={`
                                                                inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-semibold text-xs sm:text-sm
                                                                bg-${getStatusColor(booking.payment.status)}/20 text-${getStatusColor(booking.payment.status)}
                                                                `
                                                                }>
                                                                    {booking.payment.status}
                                                                </p>
                                                            ) : (
                                                                <p className={`inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-semibold text-xs sm:text-sm ${booking.trip.status === TripStatusEnum.UPCOMING
                                                                    ? 'bg-success/20 text-success'
                                                                    : 'bg-secondary-text/20 text-secondary-text'
                                                                    }`}>
                                                                    {booking.trip.status}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                                                            <div>
                                                                <p className="text-secondary-text text-xs sm:text-sm">Route</p>
                                                                <p className="font-semibold text-text text-sm sm:text-base">
                                                                    {booking.trip.route?.origin?.name || 'N/A'} → {booking.trip.route?.destination?.name || 'N/A'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-secondary-text text-xs sm:text-sm">Departure</p>
                                                                <p className="font-semibold text-text text-sm sm:text-base">{formatVNWithAMPM(new Date(booking.trip.departureTime))}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-secondary-text text-xs sm:text-sm">Seats</p>
                                                                <p className="font-semibold text-text text-sm sm:text-base">{booking.seats.map(s => s.code).join(', ')}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col justify-between md:items-end gap-3 md:gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-border">
                                                        <p className="text-xl sm:text-2xl font-bold text-accent self-end">{formatPrice(booking.totalPrice)}</p>
                                                        <Button variant="accent" size="sm" className="">
                                                            View
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </Link>
                                ))}
                            </div>

                            {bookingsQuery.data.totalPage > 1 && (
                                <div className="flex justify-center py-4">
                                    <Pagination
                                        currentPage={bookingsQuery.data.page}
                                        totalPage={bookingsQuery.data.totalPage}
                                        loadPageFn={setCurrentPage}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}