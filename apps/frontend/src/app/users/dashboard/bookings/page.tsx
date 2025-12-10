'use client'
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardBody, CardFooter } from '@/src/components/ui/card';
import { Table } from '@/src/components/ui/table';
import { Button } from '@/src/components/ui/button';
import Modal from '@/src/components/ui/modal';
import Pagination from '@/src/components/ui/pagination';
import { SelectDropdown, OptionType } from '@/src/components/ui/select-dropdown';
import Checkbox from '@/src/components/ui/checkbox';
import { useTRPC } from '@/src/utils/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookingUserSearchDtoType } from '@repo/shared';
import { formatVNWithAMPM } from '@/src/utils/format-time';
import { formatPrice } from '@/src/utils/format-price';
import { type RouterOutputsType } from 'backend';


type Booking = RouterOutputsType['booking']['userSearchBookings']['data'][number];

export default function BookingsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const trpc = useTRPC();
    const perPage = 20;

    // Pagination state
    const [bookingPage, setBookingPage] = useState(1);

    // Search filter state
    const [bookingSearchQueryInput, setBookingSearchQueryInput] = useState<BookingUserSearchDtoType>(
        {
            page: 1,
            perPage: perPage,
            upcoming: false,
            completed: false,
        }
    );
    const [bookingSearchQueryObj, setBookingSearchQueryObj] = useState<BookingUserSearchDtoType>(bookingSearchQueryInput);

    // Modal state for cancel action
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelingBooking, setCancelingBooking] = useState<Booking | null>(null);
    const [cancelBookingError, setCancelBookingError] = useState<string | undefined>();

    // Cancel booking mutation
    const cancelBookingMutationOpts = trpc.booking.userCancelBooking.mutationOptions();
    const cancelBookingMutation = useMutation({
        ...cancelBookingMutationOpts,
        onError(error) {
            setCancelBookingError(error.message);
        },
        onSuccess() {
            queryClient.removeQueries({ queryKey: trpc.booking.lookUpBooking.queryKey({ bookingCode: cancelingBooking!.lookupCode, phone: cancelingBooking!.phone }) })
            queryClient.invalidateQueries({ queryKey: trpc.booking.userSearchBookings.queryKey() });
            onCancelModalClose();
        },
    })

    const onCancelModalClose = () => {
        setShowCancelModal(false);
        setCancelingBooking(null);
        setCancelBookingError(undefined);
    };

    // Fetch user's bookings
    const bookingSearchQueryOpts = trpc.booking.userSearchBookings.queryOptions(bookingSearchQueryObj);
    const bookingSearchQuery = useQuery({
        ...bookingSearchQueryOpts,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const bookingTotalPage = Math.ceil((bookingSearchQuery.data?.total || 0) / (bookingSearchQueryObj.perPage || 10));

    return (
        <div className="flex flex-col">
            <h1 className="text-[32px] text-text dark:text-text font-bold">My Bookings</h1>
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

            <form>
                <Card className="flex flex-col mb-8">
                    <CardHeader className="text-text dark:text-text text-[20px] font-bold">FILTERS</CardHeader>
                    <CardBody className="grid grid-cols-2 gap-8 px-6 border-b border-border dark:border-border pb-4">
                        {/* Row 1: two sort dropdowns (col 1 & 2) */}
                        <div>
                            <SelectDropdown
                                label="Sort by Date"
                                id="sort-date"
                                name="sort-date"
                                isClearable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                options={[
                                    { value: 'asc', label: 'Ascending' },
                                    { value: 'desc', label: 'Descending' },
                                ]}
                                onChange={(newValue) => {
                                    const newVal: OptionType<string> = newValue as OptionType<string>;
                                    setBookingSearchQueryInput({
                                        ...bookingSearchQueryInput,
                                        sortDate: newVal ? (newVal.value as 'asc' | 'desc') : undefined,
                                    });
                                }}
                            />
                        </div>

                        <div>
                            <SelectDropdown
                                label="Sort by Price"
                                id="sort-price"
                                name="sort-price"
                                isClearable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                options={[
                                    { value: 'asc', label: 'Ascending' },
                                    { value: 'desc', label: 'Descending' },
                                ]}
                                onChange={(newValue) => {
                                    const newVal: OptionType<string> = newValue as OptionType<string>;
                                    setBookingSearchQueryInput({
                                        ...bookingSearchQueryInput,
                                        sortPrice: newVal ? (newVal.value as 'asc' | 'desc') : undefined,
                                    });
                                }}
                            />
                        </div>

                        {/* Row 2: checkboxes aligned under each column */}
                        <div className="flex items-center">
                            <Checkbox
                                id="filter-upcoming"
                                name="filter-upcoming"
                                title="Upcoming Trips"
                                checked={bookingSearchQueryInput.upcoming}
                                onChange={(e) => {
                                    const checked = e.currentTarget.checked;
                                    setBookingSearchQueryInput({
                                        ...bookingSearchQueryInput,
                                        upcoming: checked,
                                    });
                                }}
                            />
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="filter-completed"
                                name="filter-completed"
                                title="Completed Trips"
                                checked={bookingSearchQueryInput.completed}
                                onChange={(e) => {
                                    const checked = e.currentTarget.checked;
                                    setBookingSearchQueryInput({
                                        ...bookingSearchQueryInput,
                                        completed: checked,
                                    });
                                }}
                            />
                        </div>
                    </CardBody>

                    {/* Search button */}
                    <Button
                        type="submit"
                        variant="accent"
                        size="lg"
                        className="m-6"
                        onClick={(e) => {
                            e.preventDefault();
                            setBookingPage(1);
                            setBookingSearchQueryObj(bookingSearchQueryInput);
                            bookingSearchQuery.refetch();
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        Search Bookings
                    </Button>
                </Card>
            </form>

            {/* Bookings Table */}
            {bookingSearchQuery.isFetching ? (
                <div className="text-text dark:text-text flex justify-center font-bold">Loading...</div>
            ) : (
                <>
                    {bookingSearchQuery.isSuccess ? (
                        <>
                            {bookingSearchQuery.data.total > 0 ? (
                                <Card className="flex overflow-hidden">
                                    <Table
                                        data={bookingSearchQuery.data.data}
                                        rowKey={(booking) => `booking-${booking.id}`}
                                        columns={[
                                            {
                                                header: 'Booking Code',
                                                render: (booking) => booking.lookupCode,
                                            },
                                            {
                                                header: 'Trip',
                                                render: (booking) => {
                                                    const fromPlace = booking.trip?.route?.origin?.name || 'N/A';
                                                    const toPlace = booking.trip?.route?.destination?.name || 'N/A';
                                                    return `${fromPlace} → ${toPlace}`;
                                                },
                                            },
                                            {
                                                header: 'Departure',
                                                render: (booking) => {
                                                    if (!booking.trip?.departureTime) return 'N/A';
                                                    return formatVNWithAMPM(new Date(booking.trip.departureTime));
                                                },
                                            },
                                            {
                                                header: 'Total Price',
                                                render: (booking) => {
                                                    const price = Math.ceil(booking.totalPrice || 0);
                                                    return new Intl.NumberFormat('de-DE', {
                                                        style: 'currency',
                                                        currency: 'VND',
                                                        currencyDisplay: 'code',
                                                    }).format(price);
                                                },
                                            },
                                            {
                                                header: 'Payment Status',
                                                render: (booking) => {
                                                    const status = booking.payment?.status || 'UNKNOWN';
                                                    const statusColor =
                                                        status === 'COMPLETED'
                                                            ? 'text-success dark:text-success font-semibold'
                                                            : status === 'PROCESSING'
                                                                ? 'text-warning dark:text-warning font-semibold'
                                                                : 'text-secondary-text dark:text-secondary-text font-semibold';
                                                    return <span className={statusColor}>{status}</span>;
                                                },
                                            },
                                            {
                                                header: 'Actions',
                                                render: (booking) => (
                                                    <Button
                                                        className="flex-1 max-w-32"
                                                        variant="danger"
                                                        onClick={() => {
                                                            setShowCancelModal(true);
                                                            setCancelingBooking(booking);
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                ),
                                                className: 'flex justify-center gap-2 py-2 px-6',
                                            },
                                        ]}
                                        tableClassName="flex-1"
                                        headClassName="text-text dark:text-text font-bold"
                                        bodyClassName="bg-primary dark:bg-primary"
                                    />
                                </Card>
                            ) : (
                                <div className="text-text dark:text-text font-bold text-base text-center">
                                    No bookings found
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-danger dark:text-danger font-bold text-base text-center">
                            ERROR LOADING BOOKINGS
                        </div>
                    )}
                </>
            )}

            {/* Pagination */}
            {!bookingSearchQuery.isError && (
                <div className="mt-8 flex justify-center">
                    <Pagination
                        currentPage={bookingPage}
                        totalPage={bookingTotalPage}
                        loadPageFn={(newPage) => {
                            setBookingPage(newPage);
                        }}
                    />
                </div>
            )}

            {/* Cancel Booking Modal */}
            <Modal open={showCancelModal} onClose={() => onCancelModalClose()}>
                <Card
                    onClick={(e) => e.stopPropagation()}
                    className="max-w-lg min-w-lg"
                >
                    <CardHeader>
                        <h1 className="text-text dark:text-text font-bold text-xl">
                            Are you sure you want to cancel this booking?
                        </h1>
                        {cancelBookingError && (
                            <div className="text-danger dark:text-danger font-bold mt-4">
                                {cancelBookingError}
                            </div>
                        )}
                    </CardHeader>
                    <CardBody className="text-text dark:text-text">
                        {cancelingBooking && (
                            <>
                                <div>Code: {cancelingBooking.lookupCode}</div>
                                <div>
                                    Trip:{' '}
                                    {cancelingBooking.trip.route?.origin?.name || 'N/A'} -{' '}
                                    {cancelingBooking.trip.route?.destination?.name || 'N/A'}
                                </div>
                                <div>
                                    Departure:{' '}
                                    {cancelingBooking.trip.departureTime
                                        ? formatVNWithAMPM(new Date(cancelingBooking.trip.departureTime))
                                        : 'N/A'}
                                </div>
                                <div>
                                    Total Price:{' '}
                                    {formatPrice(cancelingBooking.trip.basePrice)}
                                </div>
                            </>
                        )}
                    </CardBody>
                    <CardFooter className="flex justify-between gap-6">
                        <Button
                            variant="danger"
                            className="flex-1"
                            disabled={cancelBookingMutation.isPending}
                            onClick={() => {
                                if (cancelingBooking) {
                                    cancelBookingMutation.mutate({ cancelToken: cancelingBooking.cancelToken });
                                }
                            }}
                        >
                            {cancelBookingMutation.isPending ? 'Cancelling...' : 'Confirm'}
                        </Button>
                        <Button
                            variant="primary"
                            className="flex-1"
                            onClick={() => onCancelModalClose()}
                        >
                            Cancel
                        </Button>
                    </CardFooter>
                </Card>
            </Modal>
        </div>
    );
}
