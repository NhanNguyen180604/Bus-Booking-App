"use client";
import { Button } from "@/src/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/src/components/ui/card";
import { FormField } from "@/src/components/ui/form-field";
import Pagination from "@/src/components/ui/pagination";
import { OptionType, SelectDropdown } from "@/src/components/ui/select-dropdown";
import { Table } from "@/src/components/ui/table";
import { formatPrice } from "@/src/utils/format-price";
import { formatVNWithAMPM } from "@/src/utils/format-time";
import { useTRPC } from "@/src/utils/trpc";
import { BookingAdminSearchDtoType, PaymentStatusEnum, SortOptionsType } from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getPaymentStatusColor } from "@/src/utils/get-status-color";
import { useForm, Controller } from "react-hook-form";
import Modal from "@/src/components/ui/modal";
import { CancelIcon } from "@/src/components/icons/cancel-ic";
import { type RouterOutputsType } from 'backend'

type Booking = RouterOutputsType['booking']['adminSearchBookings']['data'][0];

export default function AdminBookingsPage() {
    const trpc = useTRPC();
    const perPage = 20;

    const [searchObj, setSearchObj] = useState<BookingAdminSearchDtoType>({
        page: 1,
        perPage,
    });

    // Cancel booking modal state
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
    const [cancelBookingError, setCancelBookingError] = useState<string>();

    const cancelBookingMutation = useMutation({
        ...trpc.booking.userCancelBooking.mutationOptions(),
        onError(error) {
            setCancelBookingError(error.message);
        },
        onSuccess() {
            searchBookingsQuery.refetch();
            onCancelBookingModalClose();
        },
    });

    const onCancelBookingModalClose = () => {
        setShowCancelModal(false);
        setCancellingBooking(null);
        setCancelBookingError(undefined);
    };

    const { register, control, watch, handleSubmit, reset } = useForm<BookingAdminSearchDtoType>({
        defaultValues: {
            page: 1,
            perPage,
        },
    });

    const searchInput = watch();

    // Fetch stations for origin/destination filters
    const stationsQuery = useQuery({
        ...trpc.stations.findAll.queryOptions(),
        staleTime: 60 * 60 * 1000,
    });

    const searchBookingsQuery = useQuery({
        ...trpc.booking.adminSearchBookings.queryOptions(searchObj),
        staleTime: 60 * 1000,
    });

    const onSubmit = (data: BookingAdminSearchDtoType) => {
        setSearchObj({ ...data, page: 1 });
    };

    const handleReset = () => {
        const resetInput = {
            page: 1,
            perPage,
        };
        reset(resetInput);
        setSearchObj(resetInput);
    };

    const stations = stationsQuery.data || [];
    const stationOptions: OptionType<string>[] = stations.map(s => ({
        value: s.id,
        label: s.name
    }));

    return (
        <div className="space-y-6">
            <h1 className="text-[2rem] text-text font-bold">Manage Bookings</h1>

            {/* Filter and Sort */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader className="text-text text-xl font-bold">
                        SEARCH AND FILTER BOOKINGS
                    </CardHeader>

                    <CardBody className="flex flex-col gap-4 px-6 pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Search Query */}
                            <div>
                                <FormField
                                    label="Search by Name/Email/Phone"
                                    placeholder="Enter name, email or phone number"
                                    value={searchInput.query || ''}
                                    {...register('query')}
                                />
                            </div>

                            {/* Origin Filter */}
                            <div>
                                <Controller
                                    name="originId"
                                    control={control}
                                    render={({ field }) => (
                                        <SelectDropdown
                                            label="Origin Station"
                                            id="origin"
                                            name="origin"
                                            isClearable
                                            value={field.value ? stationOptions.find(s => s.value === field.value) : null}
                                            options={stationOptions}
                                            onChange={(newValue) => {
                                                const val = newValue as OptionType<string>;
                                                field.onChange(val ? val.value : undefined);
                                            }}
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                        />
                                    )}
                                />
                            </div>

                            {/* Destination Filter */}
                            <div>
                                <Controller
                                    name="destinationId"
                                    control={control}
                                    render={({ field }) => (
                                        <SelectDropdown
                                            label="Destination Station"
                                            id="destination"
                                            name="destination"
                                            isClearable
                                            value={field.value ? stationOptions.find(s => s.value === field.value) : null}
                                            options={stationOptions}
                                            onChange={(newValue) => {
                                                const val = newValue as OptionType<string>;
                                                field.onChange(val ? val.value : undefined);
                                            }}
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Status Filter */}
                            <div>
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <SelectDropdown
                                            label="Payment Status"
                                            id="status"
                                            name="status"
                                            isClearable
                                            value={field.value ? { value: field.value, label: field.value } : null}
                                            options={Object.values(PaymentStatusEnum).map(status => ({
                                                value: status,
                                                label: status
                                            }))}
                                            onChange={(newValue) => {
                                                const val = newValue as OptionType<string>;
                                                field.onChange(val ? val.value as PaymentStatusEnum : undefined);
                                            }}
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                        />
                                    )}
                                />
                            </div>

                            {/* Sort Date */}
                            <div>
                                <Controller
                                    name="sortDate"
                                    control={control}
                                    render={({ field }) => (
                                        <SelectDropdown
                                            label="Sort by Date"
                                            id="sortDate"
                                            name="sortDate"
                                            isClearable
                                            value={field.value ? { value: field.value, label: field.value === 'asc' ? 'Oldest First' : 'Newest First' } : null}
                                            options={[
                                                { value: 'asc', label: 'Oldest First' },
                                                { value: 'desc', label: 'Newest First' }
                                            ]}
                                            onChange={(newValue) => {
                                                const val = newValue as OptionType<SortOptionsType>;
                                                field.onChange(val ? val.value : undefined);
                                            }}
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                        />
                                    )}
                                />
                            </div>

                            {/* Sort Price */}
                            <div>
                                <Controller
                                    name="sortPrice"
                                    control={control}
                                    render={({ field }) => (
                                        <SelectDropdown
                                            label="Sort by Price"
                                            id="sortPrice"
                                            name="sortPrice"
                                            isClearable
                                            value={field.value ? { value: field.value, label: field.value === 'asc' ? 'Ascending' : 'Descending' } : null}
                                            options={[
                                                { value: 'asc', label: 'Ascending' },
                                                { value: 'desc', label: 'Descending' }
                                            ]}
                                            onChange={(newValue) => {
                                                const val = newValue as OptionType<SortOptionsType>;
                                                field.onChange(val ? val.value : undefined);
                                            }}
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </CardBody>

                    <CardFooter className="px-6 pb-6 flex gap-4 rounded-xl">
                        <Button type="button" variant="secondary" onClick={handleReset} className="flex-1">
                            Reset
                        </Button>
                        <Button type="submit" variant="accent" className="flex-1">
                            Search
                        </Button>
                    </CardFooter>
                </Card>
            </form>

            {/* Results */}
            {searchBookingsQuery.isLoading ? (
                <Card>
                    <CardBody className="py-12 text-center text-secondary-text">
                        Loading bookings...
                    </CardBody>
                </Card>
            ) : searchBookingsQuery.data && searchBookingsQuery.data.data.length > 0 ? (
                <>
                    <Card className="overflow-hidden">
                        <Table
                            data={searchBookingsQuery.data.data}
                            rowKey={(booking) => booking.id}
                            headClassName="bg-primary dark:bg-primary text-secondary-text dark:text-secondary-text text-sm"
                            bodyClassName="text-text dark:text-text text-sm"
                            columns={[
                                {
                                    header: "Lookup Code",
                                    render: (booking) => booking.lookupCode,
                                    className: "py-3 px-4 text-left",
                                    headerClassName: "py-3"
                                },
                                {
                                    header: "Customer",
                                    render: (booking) => (
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{booking.fullName}</span>
                                            <span className="text-sm text-secondary-text">{booking.phone}</span>
                                            {booking.email && <span className="text-sm text-secondary-text">{booking.email}</span>}
                                        </div>
                                    ),
                                    className: "py-3 px-4 text-left",
                                    headerClassName: "py-3"
                                },
                                {
                                    header: "Route",
                                    render: (booking) => (
                                        <span className="text-sm">
                                            {booking.trip.route.origin.name} → {booking.trip.route.destination.name}
                                        </span>
                                    ),
                                    className: "py-3 px-4 text-left",
                                    headerClassName: "py-3"
                                },
                                {
                                    header: "Departure",
                                    render: (booking) => formatVNWithAMPM(new Date(booking.trip.departureTime)),
                                    className: "py-3 px-4 text-left",
                                    headerClassName: "py-3"
                                },
                                {
                                    header: "Seats",
                                    render: (booking) => booking.seats.map(s => s.code).join(', '),
                                    className: "py-3 px-4 text-left",
                                    headerClassName: "py-3"
                                },
                                {
                                    header: "Total Price",
                                    render: (booking) => formatPrice(Number(booking.totalPrice)),
                                    className: "py-3 px-4 text-left font-semibold",
                                    headerClassName: "py-3"
                                },
                                {
                                    header: "Status",
                                    render: (booking) => (
                                        <span className={`inline-flex w-28 justify-center whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold text-${getPaymentStatusColor(booking.payment.status)} bg-${getPaymentStatusColor(booking.payment.status)}/20`}>
                                            {booking.payment.status}
                                        </span>
                                    ),
                                    className: "py-3 px-4 w-28",
                                    headerClassName: "py-3 px-4 text-left w-28"
                                },
                                {
                                    header: "Booked At",
                                    render: (booking) => formatVNWithAMPM(new Date(booking.createdAt)),
                                    className: "py-3 px-4 text-left text-sm",
                                    headerClassName: "py-3"
                                },
                                {
                                    header: "Actions",
                                    render: (booking) => (
                                        <Button
                                            variant="danger"
                                            disabled={booking.payment.status !== PaymentStatusEnum.COMPLETED}
                                            onClick={() => {
                                                setShowCancelModal(true);
                                                setCancellingBooking(booking);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    ),
                                    className: "py-3 px-4",
                                    headerClassName: "py-3"
                                }
                            ]}
                        />
                    </Card>

                    <div className="flex justify-center">
                        <Pagination
                            currentPage={searchObj.page}
                            totalPage={searchBookingsQuery.data.totalPage}
                            loadPageFn={(newPage) => {
                                setSearchObj({ ...searchObj, page: newPage });
                            }}
                        />
                    </div>
                </>
            ) : (
                <Card>
                    <CardBody className="py-12 text-center text-secondary-text">
                        No bookings found
                    </CardBody>
                </Card>
            )}

            <Modal open={showCancelModal} onClose={() => onCancelBookingModalClose()}>
                <Card onClick={(e) => e.stopPropagation()} className="max-w-lg min-w-lg">
                    <CardHeader>
                        <div className="text-text dark:text-text font-bold text-xl">
                            Are you sure you want to cancel this booking?
                        </div>
                        <div className="text-secondary-text dark:text-secondary-text mt-2 font-semibold">
                            The customer will receive a full refund.
                        </div>
                        {cancelBookingError && (
                            <div className="
                                text-danger dark:text-danger bg-danger/20 dark:bg-danger/20 
                                border border-danger dark:border-danger
                                font-bold mt-4 p-4 rounded-lg flex gap-4
                            ">
                                <CancelIcon /> <span>{cancelBookingError}</span>
                            </div>
                        )}
                    </CardHeader>
                    <CardBody className="text-text dark:text-text">
                        <div>Booking Code: {cancellingBooking?.lookupCode}</div>
                        <div>Customer: {cancellingBooking?.fullName}</div>
                        <div>Route: {cancellingBooking?.trip.route.origin.name} → {cancellingBooking?.trip.route.destination.name}</div>
                        <div>Seats: {cancellingBooking?.seats.map(s => s.code).join(', ')}</div>
                        <div>Total Price: {formatPrice(Number(cancellingBooking?.totalPrice))}</div>
                    </CardBody>
                    <CardFooter className="flex justify-between gap-6">
                        <Button variant="danger"
                            className="flex-1"
                            disabled={cancelBookingMutation.isPending}
                            onClick={() => {
                                if (cancellingBooking) cancelBookingMutation.mutate({ cancelToken: cancellingBooking.cancelToken, cancelReason: 'Requested by customer' });
                            }}>
                            {cancelBookingMutation.isPending ? "Cancelling..." : "Confirm"}
                        </Button>
                        <Button variant="primary"
                            className="flex-1"
                            onClick={() => onCancelBookingModalClose()}>
                            Keep Booking
                        </Button>
                    </CardFooter>
                </Card>
            </Modal>
        </div>
    );
}
