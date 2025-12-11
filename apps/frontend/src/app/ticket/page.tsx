"use client";

import { Card, CardBody, CardHeader } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { useTRPC } from '@/src/utils/trpc';
import { useQuery, skipToken } from '@tanstack/react-query';
import { useState } from 'react';
import { formatPrice } from '@/src/utils/format-price';
import { formatVNWithAMPM } from '@/src/utils/format-time';
import useUser from '@/src/hooks/useUser';
import { useRouter } from 'next/navigation';
import Pagination from '@/src/components/ui/pagination';
import { type RouterOutputsType } from 'backend';
import { AppShell } from '@/src/components/layout/app-shell';

type Booking = RouterOutputsType["booking"]["searchBookings"]["data"][number];

export default function TicketPage() {
    const router = useRouter();
    const trpc = useTRPC();
    const { data: user, isLoading: userLoading } = useUser();
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    // Skip the query if user is not loaded yet or not authenticated
    const bookingsQuery = useQuery(
        trpc.booking.searchBookings.queryOptions(
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
        router.push('/users/login');
        return null;
    }

    const handleDownloadTicket = (booking: Booking) => {
        // Create ticket content
        const ticketContent = generateTicketHTML(booking);

        // Create blob and download
        const blob = new Blob([ticketContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket-${booking.lookupCode}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const generateTicketHTML = (booking: Booking) => {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Bus Ticket - ${booking.lookupCode}</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
                .ticket { border: 2px solid #333; padding: 30px; background: #fff; }
                .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 20px; margin-bottom: 20px; }
                .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
                .section { margin: 20px 0; }
                .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; color: #666; }
                .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                .label { font-weight: bold; }
                .seats { display: flex; gap: 10px; flex-wrap: wrap; }
                .seat { padding: 5px 10px; background: #f0f0f0; border-radius: 4px; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="ticket">
                <div class="header">
                    <div class="title">🚌 BUS TICKET</div>
                    <div>Booking Code: <strong>${booking.lookupCode}</strong></div>
                </div>
                
                <div class="section">
                    <div class="section-title">Passenger Information</div>
                    <div class="info-row">
                        <span class="label">Name:</span>
                        <span>${booking.fullName}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Phone:</span>
                        <span>${booking.phone}</span>
                    </div>
                    ${booking.email ? `
                    <div class="info-row">
                        <span class="label">Email:</span>
                        <span>${booking.email}</span>
                    </div>` : ''}
                </div>

                <div class="section">
                    <div class="section-title">Trip Details</div>
                    <div class="info-row">
                        <span class="label">From:</span>
                        <span>${booking.trip.route?.origin?.name || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">To:</span>
                        <span>${booking.trip.route?.destination?.name || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Departure:</span>
                        <span>${new Date(booking.trip.departureTime).toLocaleString()}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Arrival:</span>
                        <span>${new Date(booking.trip.arrivalTime).toLocaleString()}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Bus Type:</span>
                        <span>${booking.trip.bus?.type?.name || 'N/A'}</span>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Seat Information</div>
                    <div class="seats">
                        ${booking.seats.map(seat => `<div class="seat">Seat ${seat.code}</div>`).join('')}
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Payment Information</div>
                    <div class="info-row">
                        <span class="label">Total Price:</span>
                        <span><strong>$${booking.totalPrice}</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="label">Status:</span>
                        <span>${booking.payment.status}</span>
                    </div>
                </div>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 2px dashed #333; text-align: center; color: #666;">
                    <p>Please present this ticket at the departure station</p>
                    <p>Thank you for choosing our service!</p>
                </div>
            </div>
        </body>
        </html>`;
    };

    return (
        <AppShell hideNav>
            <div className="min-h-screen bg-background py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-text mb-8">My Tickets</h1>

                    {selectedBooking ? (
                        // Ticket Detail View
                        <div className="space-y-4">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedBooking(null)}
                            >
                                ← Back to Bookings
                            </Button>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-text">Ticket Details</h2>
                                        <Button
                                            variant="accent"
                                            onClick={() => handleDownloadTicket(selectedBooking)}
                                        >
                                            📥 Download Ticket
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardBody className="space-y-6">
                                    {/* Booking Code */}
                                    <div className="text-center py-4 bg-primary rounded-lg">
                                        <p className="text-sm text-secondary-text uppercase font-semibold">Booking Code</p>
                                        <p className="text-3xl font-bold text-accent mt-2">{selectedBooking.lookupCode}</p>
                                    </div>

                                    {/* Passenger Info */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-text mb-3">Passenger Information</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-secondary-text uppercase font-semibold">Name</p>
                                                <p className="text-lg font-semibold text-text mt-1">{selectedBooking.fullName}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-secondary-text uppercase font-semibold">Phone</p>
                                                <p className="text-lg font-semibold text-text mt-1">{selectedBooking.phone}</p>
                                            </div>
                                            {selectedBooking.email && (
                                                <div>
                                                    <p className="text-xs text-secondary-text uppercase font-semibold">Email</p>
                                                    <p className="text-lg font-semibold text-text mt-1">{selectedBooking.email}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Trip Info */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-text mb-3">Trip Information</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-secondary-text uppercase font-semibold">From</p>
                                                <p className="text-lg font-semibold text-text mt-1">{selectedBooking.trip.route?.origin?.name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-secondary-text uppercase font-semibold">To</p>
                                                <p className="text-lg font-semibold text-text mt-1">{selectedBooking.trip.route?.destination?.name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-secondary-text uppercase font-semibold">Departure</p>
                                                <p className="text-lg font-semibold text-text mt-1">{formatVNWithAMPM(new Date(selectedBooking.trip.departureTime))}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-secondary-text uppercase font-semibold">Arrival</p>
                                                <p className="text-lg font-semibold text-text mt-1">{formatVNWithAMPM(new Date(selectedBooking.trip.arrivalTime))}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-secondary-text uppercase font-semibold">Bus Type</p>
                                                <p className="text-lg font-semibold text-text mt-1">{selectedBooking.trip.bus?.type?.name || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Seats */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-text mb-3">Seat Numbers</h3>
                                        <div className="flex gap-2 flex-wrap">
                                            {selectedBooking.seats.map((seat) => (
                                                <div key={seat.id} className="px-4 py-2 bg-accent text-white rounded-lg font-semibold">
                                                    {seat.code}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Payment */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-text mb-3">Payment Information</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-secondary-text uppercase font-semibold">Total Price</p>
                                                <p className="text-2xl font-bold text-accent mt-1">{formatPrice(selectedBooking.totalPrice)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-secondary-text uppercase font-semibold">Status</p>
                                                <p className={`inline-block px-3 py-1 rounded-full font-semibold text-sm mt-1 ${selectedBooking.payment.status === 'COMPLETED'
                                                    ? 'bg-success/20 text-success'
                                                    : 'bg-warning/20 text-warning'
                                                    }`}>
                                                    {selectedBooking.payment.status}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    ) : (
                        // Booking History List
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
                                            <Card key={booking.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedBooking(booking)}>
                                                <CardBody>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h3 className="text-lg font-bold text-text">{booking.lookupCode}</h3>
                                                                <span className={`px-3 py-1 rounded-full font-semibold text-xs ${booking.payment.status === 'COMPLETED'
                                                                    ? 'bg-success/20 text-success'
                                                                    : 'bg-warning/20 text-warning'
                                                                    }`}>
                                                                    {booking.payment.status}
                                                                </span>
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
                    )}
                </div>
            </div>
        </AppShell>
    );
}
