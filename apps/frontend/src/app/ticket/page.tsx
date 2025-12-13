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

export default function TicketPage() {
    const router = useRouter();
    const trpc = useTRPC();
    const { data: user, isLoading: userLoading } = useUser();
    const [currentPage, setCurrentPage] = useState(1);

    // Skip the query if user is not loaded yet or not authenticated
    const bookingsQuery = useQuery(
        trpc.booking.userSearchBookings.queryOptions(
            user ? {
                page: currentPage,
                perPage: 10,
            } : skipToken
        )
    );

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
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-text mb-8">My Tickets</h1>(
                {/* Booking History List */}
                <div className="space-y-4">
                    {bookingsQuery.isLoading && (
                        <Card>
                            <CardBody className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                            </CardBody>
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
                                    <Card key={booking.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/ticket/details/' + booking.id)}>
                                        <CardBody>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-bold text-text">{booking.lookupCode}</h3>
                                                        <p className={`inline-block px-3 py-1 rounded-full font-semibold text-md ${new Date(booking.trip.departureTime) < new Date()
                                                            ? 'bg-secondary-text/20 text-secondary-text'
                                                            : 'bg-success/20 text-success'
                                                            }`}>
                                                            {new Date(booking.trip.departureTime) < new Date() ? 'Completed' : 'Upcoming'}
                                                        </p>
                                                    </div>
                                                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-secondary-text">Route</p>
                                                            <p className="font-semibold text-text">
                                                                {booking.trip.route?.origin?.name || 'N/A'} → {booking.trip.route?.destination?.name || 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-secondary-text">Departure</p>
                                                            <p className="font-semibold text-text">{formatVNWithAMPM(new Date(booking.trip.departureTime))}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-secondary-text">Seats</p>
                                                            <p className="font-semibold text-text">{booking.seats.map(s => s.code).join(', ')}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-accent">{formatPrice(booking.totalPrice)}</p>
                                                    <Button variant="accent" size="sm" className="mt-2">
                                                        View Ticket →
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
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
                )
            </div>
        </div>
    );
}