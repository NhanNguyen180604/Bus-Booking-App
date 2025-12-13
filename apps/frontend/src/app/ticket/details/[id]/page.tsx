"use client";

import { Button } from "@/src/components/ui/button";
import { Card, CardBody, CardHeader } from "@/src/components/ui/card";
import { FormField } from "@/src/components/ui/form-field";
import { formatPrice } from "@/src/utils/format-price";
import { formatVNWithAMPM } from "@/src/utils/format-time";
import { useTRPC } from "@/src/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookingUpdateDto, BookingUpdateDtoType } from "@repo/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type RouterOutputsType } from "backend";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

type Booking = RouterOutputsType["booking"]["userSearchBookings"]["data"][number];

export default function TicketDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const router = useRouter();
    const trpc = useTRPC();
    const findOneBookingById = trpc.booking.findOneById.queryOptions({ id });
    const bookingQuery = useQuery({
        ...findOneBookingById
    })
    const selectedBooking = bookingQuery.data;

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
            setShowEditModal(true);
        }
    };

    const handleConfirmEdit = (data: Omit<BookingUpdateDtoType, 'bookingId'>) => {
        if (selectedBooking) {
            updateBookingMutation.mutate({
                bookingId: selectedBooking.id,
                ...data,
            });
        }
    };

    const handleCloseEditModal = () => {
        if (!updateBookingMutation.isPending) {
            setShowEditModal(false);
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
                    <div className="bg-background rounded-lg p-6 max-w-lg w-full mx-4 my-8" onClick={(e) => e.stopPropagation()}>
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
                                {...register('email')}
                                error={formErrors.email?.message}
                            />

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
                                    disabled={updateBookingMutation.isPending}
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