"use client";

import { Button } from "@/src/components/ui/button";
import { Card, CardBody, CardHeader } from "@/src/components/ui/card";
import { FormField } from "@/src/components/ui/form-field";
import { formatPrice } from "@/src/utils/format-price";
import { formatVNWithAMPM } from "@/src/utils/format-time";
import { useTRPC } from "@/src/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookingUpdateDto, BookingUpdateDtoType, generateSeatCode, SeatTypeEnum } from "@repo/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type RouterOutputsType } from "backend";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

type Booking = RouterOutputsType["booking"]["userSearchBookings"]["data"][number];
type Seat = RouterOutputsType["buses"]["getSeatsByBus"][number];

export default function TicketDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSeatSelection, setShowSeatSelection] = useState(false);
    const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
    const [selectedFloor, setSelectedFloor] = useState(0);

    const router = useRouter();
    const trpc = useTRPC();
    const findOneBookingById = trpc.booking.findOneById.queryOptions({ id });
    const bookingQuery = useQuery({
        ...findOneBookingById
    })
    const selectedBooking = bookingQuery.data;

    // Fetch seats for the trip when editing
    const getSeatsQueryOptions = trpc.buses.getSeatsByBus.queryOptions({
        id: selectedBooking?.trip?.bus?.id!
    });
    const getSeatsQuery = useQuery({
        ...getSeatsQueryOptions,
        enabled: !!selectedBooking?.trip?.bus?.id && showEditModal,
    });

    const getBookingSeatsQueryOptions = trpc.booking.getBookingSeatsByTrip.queryOptions({
        tripId: selectedBooking?.trip?.id!
    });
    const getBookingSeatsQuery = useQuery({
        ...getBookingSeatsQueryOptions,
        enabled: !!selectedBooking?.trip?.id && showEditModal,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    const cancelBookingMutationOptions = trpc.booking.userCancelBooking.mutationOptions();
    const cancelBookingMutation = useMutation({
        ...cancelBookingMutationOptions,
        onSuccess: () => {
            setShowCancelModal(false);
            router.push('/ticket');
        },
    });

    const updateBookingMutationOptions = trpc.booking.updateBooking.mutationOptions();
    const updateBookingMutation = useMutation({
        ...updateBookingMutationOptions,
        onSuccess: () => {
            setShowEditModal(false);
            bookingQuery.refetch();
        },
    });

    const {
        register,
        formState: { errors: formErrors },
        handleSubmit,
        reset,
    } = useForm<Omit<BookingUpdateDtoType, 'bookingId'>>({
        resolver: zodResolver(BookingUpdateDto.omit({ bookingId: true })),
        mode: 'onChange',
    });

    const handleCancelClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowCancelModal(true);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedBooking) {
            reset({
                fullName: selectedBooking.fullName,
                phone: selectedBooking.phone,
                email: selectedBooking.email || '',
            });
            setSelectedSeats([]);
            setSelectedFloor(0);
            setShowEditModal(true);
        }
    };

    const handleConfirmEdit = (data: Omit<BookingUpdateDtoType, 'bookingId'>) => {
        if (selectedBooking) {
            const seatIds = selectedSeats.length > 0 ? selectedSeats.map(s => s.id) : undefined;
            updateBookingMutation.mutate({
                bookingId: selectedBooking.id,
                ...data,
                seatIds,
            });
        }
    };

    const handleCloseEditModal = () => {
        if (!updateBookingMutation.isPending) {
            setShowEditModal(false);
            setShowSeatSelection(false);
            setSelectedSeats([]);
            setSelectedFloor(0);
            reset();
        }
    };

    const handleConfirmCancel = () => {
        if (selectedBooking?.cancelToken) {
            cancelBookingMutation.mutate({ cancelToken: selectedBooking.cancelToken });
        }
    };

    const handleCloseModal = () => {
        if (!cancelBookingMutation.isPending) {
            setShowCancelModal(false);
        }
    };

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
        const departureDateTime = new Date(booking.trip.departureTime).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
        const seatCodes = booking.seats.map(seat => seat.code);

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>E-Ticket - Bus Booking Confirmation</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                    line-height: 1.6;
                    color: #050505;
                    background: #eee;
                }

                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background: #fff;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }

                .header {
                    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                    color: hsla(0, 0%, 95%, 1);
                    padding: 30px 20px;
                    text-align: center;
                }

                .header h1 {
                    font-size: 28px;
                    margin-bottom: 10px;
                    font-weight: 600;
                }

                .header p {
                    font-size: 14px;
                    opacity: 0.9;
                }

                .content {
                    padding: 30px 20px;
                }

                .greeting {
                    margin-bottom: 25px;
                }

                .greeting h2 {
                    font-size: 20px;
                    margin-bottom: 10px;
                    color: #050505;
                }

                .booking-code {
                    background: #f3f4f6;
                    border-left: 4px solid #2563eb;
                    padding: 15px;
                    margin-bottom: 25px;
                    border-radius: 4px;
                }

                .booking-code label {
                    display: block;
                    font-size: 12px;
                    color: #6b7280;
                    margin-bottom: 5px;
                    font-weight: 500;
                    text-transform: uppercase;
                }

                .booking-code .code {
                    font-size: 18px;
                    font-weight: 600;
                    color: #050505;
                    font-family: 'Courier New', monospace;
                    letter-spacing: 2px;
                }

                .trip-details {
                    background: #f9fafb;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 25px;
                }

                .trip-header {
                    font-size: 14px;
                    color: #6b7280;
                    text-transform: uppercase;
                    margin-bottom: 15px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }

                .route {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 20px;
                }

                .route-location {
                    flex: 1;
                }

                .route-location .label {
                    font-size: 12px;
                    color: #9ca3af;
                    margin-bottom: 5px;
                    text-transform: uppercase;
                }

                .route-location .location {
                    font-size: 18px;
                    font-weight: 600;
                    color: #050505;
                }

                .route-arrow {
                    color: #2563eb;
                    font-size: 24px;
                    font-weight: bold;
                }

                .departure-info {
                    background: #fff;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    padding: 15px;
                    margin-bottom: 15px;
                }

                .departure-info label {
                    display: block;
                    font-size: 12px;
                    color: #6b7280;
                    margin-bottom: 5px;
                    text-transform: uppercase;
                    font-weight: 500;
                }

                .departure-info .time {
                    font-size: 16px;
                    font-weight: 600;
                    color: #050505;
                }

                .seats-section {
                    margin-bottom: 25px;
                }

                .seats-title {
                    font-size: 14px;
                    color: #6b7280;
                    text-transform: uppercase;
                    margin-bottom: 12px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }

                .seat-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .seat-badge {
                    background: #dbeafe;
                    color: #1e40af;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    border: 1px solid #93c5fd;
                }

                .price-section {
                    background: #ecfdf5;
                    border-left: 4px solid #10b981;
                    padding: 15px;
                    border-radius: 4px;
                    margin-bottom: 25px;
                }

                .price-label {
                    font-size: 12px;
                    color: #047857;
                    margin-bottom: 5px;
                    text-transform: uppercase;
                    font-weight: 600;
                }

                .price {
                    font-size: 24px;
                    font-weight: 700;
                    color: #059669;
                }

                .footer {
                    background: #f3f4f6;
                    padding: 20px;
                    text-align: center;
                    border-top: 1px solid #e5e7eb;
                }

                .footer p {
                    font-size: 12px;
                    color: #6b7280;
                    margin-bottom: 10px;
                }

                .footer-note {
                    font-size: 11px;
                    color: #9ca3af;
                    line-height: 1.5;
                }

                .divider {
                    height: 1px;
                    background: #e5e7eb;
                    margin: 20px 0;
                }

                .busbus{
                    text-align: center;
                    font-size: 2rem;
                    font-weight: bold;
                    margin: 10px 0;
                }

                @media print { 
                    body { 
                        margin: 0;
                        background: #fff;
                    }
                    .container {
                        box-shadow: none;
                        margin: 0;
                    }
                }

                @media (max-width: 600px) {
                    .container {
                        margin: 10px;
                    }

                    .content {
                        padding: 20px 15px;
                    }

                    .header {
                        padding: 20px 15px;
                    }

                    .header h1 {
                        font-size: 24px;
                    }

                    .route {
                        flex-direction: column;
                        gap: 10px;
                    }

                    .route-arrow {
                        transform: rotate(90deg);
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Header -->
                <div class="header">
                    <h1>✓ Booking Confirmed</h1>
                    <p>Your e-ticket is ready</p>
                </div>

                <div class="busbus"> BusBus </div>

                <!-- Content -->
                <div class="content">
                    <!-- Greeting -->
                    <div class="greeting">
                        <h2>Hello ${booking.fullName},</h2>
                        <p>Thank you for your booking! Your payment has been confirmed and your ticket is attached below.</p>
                    </div>

                    <!-- Booking Code -->
                    <div class="booking-code">
                        <label>Booking Code</label>
                        <div class="code">${booking.lookupCode}</div>
                    </div>

                    <!-- Trip Details -->
                    <div class="trip-details">
                        <div class="trip-header">Trip Details</div>
                        
                        <!-- Route -->
                        <div class="route">
                            <div class="route-location">
                                <div class="label">From</div>
                                <div class="location">${booking.trip.route?.origin?.name || 'N/A'}</div>
                            </div>
                            <div class="route-arrow">→</div>
                            <div class="route-location">
                                <div class="label">To</div>
                                <div class="location">${booking.trip.route?.destination?.name || 'N/A'}</div>
                            </div>
                        </div>

                        <!-- Departure -->
                        <div class="departure-info">
                            <label>Departure Date & Time</label>
                            <div class="time">${departureDateTime}</div>
                        </div>
                    </div>

                    <!-- Seats -->
                    <div class="seats-section">
                        <div class="seats-title">Reserved Seats</div>
                        <div class="seat-list">
                            ${seatCodes.map(code => `<span class="seat-badge">${code}</span>`).join('\n                    ')}
                        </div>
                    </div>

                    <!-- Price -->
                    <div class="price-section">
                        <div class="price-label">Total Price</div>
                        <div class="price">${formatPrice(booking.totalPrice)}</div>
                    </div>

                    <div class="divider"></div>

                    <!-- Important Notes -->
                    <div>
                        <h3 style="font-size: 14px; margin-bottom: 10px; color: #050505;">Important Information</h3>
                        <ul style="font-size: 13px; color: #4b5563; line-height: 1.8; padding-left: 20px;">
                            <li>Please arrive at least 30 minutes before departure</li>
                            <li>Keep your booking code safe - you'll need it to check in</li>
                            <li>Bring a valid ID for verification</li>
                            <li>If you need to cancel, please contact us as soon as possible</li>
                        </ul>
                    </div>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <p>Bus Booking App</p>
                    <p class="footer-note">
                        This is an automated email. If you didn't make this booking or have any questions, 
                        please contact our support team immediately.
                    </p>
                </div>
            </div>
        </body>
        </html>`;
    };
    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-text mb-8">My Tickets</h1>
            {/* Loading State */}
            {bookingQuery.isLoading && (
                <div className="min-h-screen bg-background py-8 px-4">
                    <div className="max-w-4xl mx-auto">
                        <Card>
                            <CardBody className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            )}

            {/* Error State - No Ticket Found */}
            {bookingQuery.isError && (
                <div className="min-h-screen bg-background py-8 px-4">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-accent hover:text-accent/80 mb-6 cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            >
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            Go back
                        </button>

                        <Card className="border-danger">
                            <CardBody className="py-12">
                                <div className="flex flex-col items-center text-center">
                                    <svg className="w-16 h-16 text-danger mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <h2 className="text-2xl font-bold text-text mb-2">No Ticket Found</h2>
                                    <p className="text-secondary-text mb-6 max-w-md">
                                        {bookingQuery.error?.message || "We couldn't find a ticket with this ID. Please check your booking code or search again."}
                                    </p>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="accent"
                                            onClick={() => router.push('/ticket')}
                                        >
                                            Search Tickets
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => router.push('/')}
                                        >
                                            Go to Home
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            )}

            {/* Ticket Detail View */}
            {selectedBooking && !bookingQuery.isLoading && !bookingQuery.isError && (
                <div className="space-y-4">
                    <div className='flex justify-between items-center my-1'>
                        <button
                            onClick={() => router.push('/ticket')}
                            className="flex items-center gap-2 text-accent hover:text-accent/80 mb-6 cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            >
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            Tickets
                        </button>
                        <Button
                            variant='primary'
                            onClick={() => handleDownloadTicket(selectedBooking)}
                            className='flex items-center gap-1'
                        >
                            <Image src="/icons/download-ic.svg" alt="Download" width={24} height={24} />
                            Download Ticket
                        </Button>
                    </div>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className='flex gap-2'>
                                    <h2 className="text-2xl font-bold text-text">Ticket Details</h2>
                                    <p className={`inline-block px-3 py-1 rounded-full font-semibold text-lg ${new Date(selectedBooking.trip.departureTime) < new Date()
                                        ? 'bg-secondary-text/20 text-secondary-text'
                                        : 'bg-success/20 text-success'
                                        }`}>
                                        {new Date(selectedBooking.trip.departureTime) < new Date() ? 'Completed' : 'Upcoming'}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {new Date(selectedBooking.trip.departureTime) > new Date() && selectedBooking.cancelToken && (
                                        <>
                                            <Button
                                                variant="accent"
                                                onClick={handleEditClick}
                                                className='flex items-center gap-1'
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                    <path d="m15 5 4 4" />
                                                </svg>
                                                Edit Booking
                                            </Button>
                                            <Button
                                                variant="danger"
                                                onClick={handleCancelClick}
                                                className='flex items-center gap-1'
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 6h18" />
                                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                </svg>
                                                Cancel Booking
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardBody className="space-y-9">
                            {/* Booking Code */}
                            <div className="text-center py-4 bg-primary rounded-lg">
                                <p className="text-sm text-secondary-text uppercase font-semibold">Booking Code</p>
                                <p className="text-xl font-bold text-accent mt-2">{selectedBooking.lookupCode}</p>
                            </div>

                            <div className="border-t border-border"></div>

                            {/* Passenger Info */}
                            <div>
                                <h3 className="text-xl font-semibold text-text mb-3">Passenger Information</h3>
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

                            <div className="border-t border-border"></div>

                            {/* Trip Info */}
                            <div className='m'>
                                <h3 className="text-xl font-semibold text-text mb-3">Trip Information</h3>
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

                            <div className="border-t border-border"></div>

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

                            <div className="border-t border-border"></div>

                            {/* Payment */}
                            <div>
                                <h3 className="text-xl font-semibold text-text mb-3">Payment Information</h3>
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
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelModal && selectedBooking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCloseModal}>
                    <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start gap-4 mb-4">
                            <div className="shrink-0 w-12 h-12 rounded-full bg-danger/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-text">Cancel Booking</h3>
                                <p className="text-sm text-secondary-text">
                                    Are you sure you want to cancel this booking?
                                </p>
                            </div>
                        </div>

                        <div className="bg-primary rounded-lg p-3 mb-4">
                            <p className="text-xs text-secondary-text mb-1">Booking Code</p>
                            <p className="font-mono font-bold text-accent">{selectedBooking.lookupCode}</p>
                            <p className="text-xs text-secondary-text mt-2">Route</p>
                            <p className="text-sm font-semibold text-text">
                                {selectedBooking.trip.route?.origin?.name} → {selectedBooking.trip.route?.destination?.name}
                            </p>
                            <p className="text-xs text-secondary-text mt-2">Departure</p>
                            <p className="text-sm font-semibold text-text">
                                {formatVNWithAMPM(new Date(selectedBooking.trip.departureTime))}
                            </p>
                        </div>
                        <div className='flex items-center gap-2 mb-4'>
                            <svg className="w-9 h-9 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-sm text-text font-semibold">
                                This action cannot be undone. Your booking will be permanently deleted.
                            </p>
                        </div>
                        {cancelBookingMutation.isError && (
                            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                                <p className="text-sm text-danger">
                                    {cancelBookingMutation.error?.message || 'Failed to cancel booking. Please try again.'}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="secondary"
                                onClick={handleCloseModal}
                                disabled={cancelBookingMutation.isPending}
                            >
                                Keep Booking
                            </Button>
                            <Button
                                variant="accent"
                                onClick={handleConfirmCancel}
                                disabled={cancelBookingMutation.isPending}
                                className="bg-danger hover:bg-danger/90"
                            >
                                {cancelBookingMutation.isPending ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Canceling...
                                    </>
                                ) : (
                                    'Yes, Cancel Booking'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Booking Modal */}
            {showEditModal && selectedBooking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto" onClick={handleCloseEditModal}>
                    <div className="bg-background rounded-lg p-6 max-w-lg w-full mx-4 my-8 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start gap-4 mb-4">
                            <div className="shrink-0 w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-text">Edit Booking</h3>
                                <p className="text-sm text-secondary-text">
                                    Update your passenger information
                                </p>
                            </div>
                        </div>
                        <div className="bg-primary rounded-lg p-3 mb-4">
                            <p className="text-xs text-secondary-text mb-1">Booking Code</p>
                            <p className="font-mono font-bold text-accent">{selectedBooking.lookupCode}</p>
                        </div>

                        <form onSubmit={handleSubmit(handleConfirmEdit)} className="space-y-4">
                            <FormField
                                label="Full Name"
                                placeholder="Enter full name"
                                required
                                {...register('fullName')}
                                error={formErrors.fullName?.message}
                            />
                            <FormField
                                label="Phone Number"
                                placeholder="Enter phone number"
                                required
                                {...register('phone')}
                                error={formErrors.phone?.message}
                            />
                            <FormField
                                label="Email"
                                type="email"
                                placeholder="Enter email address"
                                required
                                {...register('email')}
                                error={formErrors.email?.message}
                            />

                            {/* Seat Selection Toggle */}
                            {selectedBooking && (
                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowSeatSelection(!showSeatSelection);
                                            if (!showSeatSelection) {
                                                setSelectedSeats([]);
                                            }
                                        }}
                                        className="w-full flex items-center justify-between p-3 bg-primary hover:bg-primary/80 rounded-lg border border-border transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Image src="/icons/seat-ic.svg" alt="Seats" width={20} height={20} />
                                            <span className="text-sm font-semibold text-text">
                                                {showSeatSelection ? 'Hide Seat Selection' : 'Change Seats'}
                                            </span>
                                            {selectedSeats.length > 0 && (
                                                <span className="text-xs px-2 py-0.5 bg-accent text-white rounded-full">
                                                    {selectedSeats.length} selected
                                                </span>
                                            )}
                                        </div>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className={`transition-transform ${showSeatSelection ? 'rotate-180' : ''}`}
                                        >
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    </button>

                                    {/* Seat Selection */}
                                    {showSeatSelection && getSeatsQuery.data && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-semibold text-text">
                                                    Select Seats ({selectedSeats.length}/{selectedBooking.seats.length})
                                                </label>
                                                {selectedSeats.length > 0 && selectedSeats.length !== selectedBooking.seats.length && (
                                                    <span className="text-xs text-danger">
                                                        Must select exactly {selectedBooking.seats.length} seat{selectedBooking.seats.length > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Selected Seats Display */}
                                            {selectedSeats.length > 0 && (
                                                <div className="flex gap-2 flex-wrap p-2 bg-accent/10 rounded">
                                                    {selectedSeats.map((seat) => (
                                                        <div key={seat.id} className="px-2 py-1 bg-accent text-white rounded text-xs font-semibold">
                                                            {seat.code}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Floor Selector */}
                                            {selectedBooking.trip.bus.floors > 1 && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-text">Floor:</span>
                                                    {Array.from({ length: selectedBooking.trip.bus.floors }, (_, i) => (
                                                        <Button
                                                            key={i}
                                                            type="button"
                                                            variant={selectedFloor === i ? "accent" : "secondary"}
                                                            size="sm"
                                                            onClick={() => setSelectedFloor(i)}
                                                        >
                                                            {i + 1}
                                                        </Button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Seat Grid */}
                                            <div className="border border-border rounded-lg p-4 bg-primary">
                                                {/* Legend */}
                                                <div className="flex flex-wrap items-center gap-3 mb-4 pb-3 border-b border-border text-xs">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-6 h-6 rounded bg-primary border border-text/10"></div>
                                                        <span className="text-secondary-text">Available</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-6 h-6 rounded bg-accent"></div>
                                                        <span className="text-secondary-text">Selected</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-6 h-6 rounded bg-text/10"></div>
                                                        <span className="text-secondary-text">Booked</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded bg-text/10 border border-dashed border-text flex items-center justify-center text-text">
                                                            <Image src={"/icons/steering-wheel.svg"} alt={`driver icon`} width={12} height={12} />
                                                        </div>
                                                        <span className="text-sm text-secondary-text">Driver</span>
                                                    </div>
                                                </div>

                                                {/* Seat Layout */}
                                                <div className="relative">
                                                    <div className="text-center text-xs text-secondary-text mb-3 font-medium">
                                                        FRONT OF BUS
                                                    </div>
                                                    <div
                                                        className="grid gap-2 mx-auto"
                                                        style={{
                                                            maxWidth: 'fit-content',
                                                            gridTemplateColumns: `repeat(${selectedBooking.trip.bus.cols}, minmax(0, 1fr))`,
                                                        }}
                                                    >
                                                        {Array.from({ length: selectedBooking.trip.bus.rows }).map((_, rowIndex) => (
                                                            <React.Fragment key={`seat-row-${rowIndex}`}>
                                                                {Array.from({ length: selectedBooking.trip.bus.cols }).map((_, colIndex) => {
                                                                    const seatCode = generateSeatCode(rowIndex, colIndex, selectedFloor);
                                                                    const seat = getSeatsQuery.data.find(s => s.code === seatCode);

                                                                    let status: "driver" | "selected" | "booked" | "available" | "aisle" = "aisle";
                                                                    if (seat) {
                                                                        if (seat.seatType === SeatTypeEnum.DRIVER) {
                                                                            status = "driver";
                                                                        } else if (selectedSeats.some(s => s.id === seat.id)) {
                                                                            status = "selected";
                                                                        } else if (getBookingSeatsQuery.data?.some(s => s.id === seat.id) &&
                                                                            !selectedBooking.seats.some(s => s.id === seat.id)) {
                                                                            status = "booked";
                                                                        } else {
                                                                            status = "available";
                                                                        }
                                                                    }

                                                                    const getSeatClassName = () => {
                                                                        const base = "w-10 h-10 rounded transition-all flex items-center justify-center text-xs font-semibold border";
                                                                        switch (status) {
                                                                            case "available":
                                                                                return `${base} bg-primary hover:bg-accent/10 border-text/10 text-text hover:border-accent cursor-pointer`;
                                                                            case "selected":
                                                                                return `${base} bg-accent text-white border-accent cursor-pointer`;
                                                                            case "booked":
                                                                                return `${base} bg-text/10 text-text border-text cursor-not-allowed opacity-50`;
                                                                            case "driver":
                                                                                return `${base} bg-text/10 text-text border-text border-dashed cursor-not-allowed`;
                                                                            case "aisle":
                                                                                return "w-10 h-10";
                                                                        }
                                                                    };

                                                                    const handleSeatClick = () => {
                                                                        if (!seat || status === "booked" || status === "driver") return;

                                                                        setSelectedSeats(prev => {
                                                                            const isSelected = prev.some(s => s.id === seat.id);
                                                                            if (isSelected) {
                                                                                return prev.filter(s => s.id !== seat.id);
                                                                            } else if (prev.length < selectedBooking.seats.length) {
                                                                                return [...prev, seat];
                                                                            }
                                                                            return prev;
                                                                        });
                                                                    };

                                                                    return (
                                                                        <button
                                                                            key={`seat-${rowIndex}-${colIndex}`}
                                                                            type="button"
                                                                            className={getSeatClassName()}
                                                                            onClick={handleSeatClick}
                                                                            disabled={status === "booked" || status === "driver" || !seat}
                                                                            title={seat?.code}
                                                                        >
                                                                            {seat && (
                                                                                status === 'driver' ? (
                                                                                    <Image src="/icons/steering-wheel.svg" alt="driver" width={16} height={16} />
                                                                                ) : (
                                                                                    seat.code
                                                                                )
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                    <div className="text-center text-xs text-secondary-text mt-3 font-medium">
                                                        BACK OF BUS
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {updateBookingMutation.isError && (
                                <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
                                    <p className="text-sm text-danger">
                                        {updateBookingMutation.error?.message || 'Failed to update booking. Please try again.'}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 justify-end pt-4">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleCloseEditModal}
                                    disabled={updateBookingMutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="accent"
                                    disabled={updateBookingMutation.isPending || (selectedSeats.length > 0 && selectedSeats.length !== selectedBooking!.seats.length)}
                                >
                                    {updateBookingMutation.isPending ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}