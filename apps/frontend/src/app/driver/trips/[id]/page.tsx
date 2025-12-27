"use client"

import { CancelIcon } from "@/src/components/icons/cancel-ic";
import { CheckIcon } from "@/src/components/icons/check-ic";
import ForbiddenPage from "@/src/components/status-pages/forbidden-page";
import NotFoundPage from "@/src/components/status-pages/not-found-page";
import UnauthorizedPage from "@/src/components/status-pages/unauthorized-page";
import { Button } from "@/src/components/ui/button";
import { Card, CardBody } from "@/src/components/ui/card";
import Checkbox from "@/src/components/ui/checkbox";
import { FormField } from "@/src/components/ui/form-field";
import Loading from "@/src/components/ui/loading";
import Modal from "@/src/components/ui/modal";
import { OptionType, SelectDropdown } from "@/src/components/ui/select-dropdown";
import useUser from "@/src/hooks/useUser";
import { formatVNWithAMPM } from "@/src/utils/format-time";
import { useTRPC } from "@/src/utils/trpc";
import { TripStatusEnum } from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState } from "react";

export default function DriverTripDetailsPage() {
    const { id: tripId } = useParams<{ id: string }>();

    const router = useRouter();
    const trpc = useTRPC();
    const userQuery = useUser();
    const queryClient = useQueryClient();

    const tripQuery = useQuery({
        ...trpc.trips.driverFindOneTripById.queryOptions({ id: tripId }),
        staleTime: 10 * 60 * 1000,
    });
    useEffect(() => {
        if (tripQuery.data) {
            setTripStatus(tripQuery.data.trip.status);
        }
    }, [tripQuery.data]);

    const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);
    const [statusUpdateError, setStatusUpdateError] = useState(false);
    const updateTripMutation = useMutation({
        ...trpc.trips.updateOne.mutationOptions(),
        onSuccess() {
            const updatedData = tripQuery.data;
            if (updatedData) {
                updatedData.trip.status = tripStatus;
                queryClient.setQueryData(trpc.trips.driverFindOneTripById.queryKey({ id: tripId }), {
                    ...tripQuery.data,
                    trip: {
                        ...tripQuery.data.trip,
                        status: tripStatus,
                    }
                })
            }
            setStatusUpdateSuccess(true);
            setStatusUpdateError(false);
        },
        onError() {
            setStatusUpdateSuccess(false);
            setStatusUpdateError(true);
        },
    });
    const [tripStatus, setTripStatus] = useState<TripStatusEnum>(TripStatusEnum.UPCOMING);

    const [openCheckIn, setOpenCheckIn] = useState(false);
    const [searchCustomerQuery, setSearchCustomerQuery] = useState('');
    const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const checkInMutation = useMutation({
        ...trpc.booking.checkInBooking.mutationOptions(),
        onMutate({ bookingId, checkedIn }) {
            const oldData = tripQuery.data;
            const updatedData = structuredClone(tripQuery.data);
            if (updatedData) {
                const users = updatedData.users;
                users.forEach(u => {
                    if (u.bookingId === bookingId) u.checkedIn = checkedIn;
                });
                queryClient.setQueryData(trpc.trips.driverFindOneTripById.queryKey({ id: tripId }), updatedData);
            }
            return oldData;
        },
        onSuccess(data) {
            if (tripQuery.data) {
                const updatedData = tripQuery.data;
                const users = updatedData.users;
                users.forEach(u => {
                    if (u.bookingId === data.bookingId) u.checkedIn = data.checkedIn;
                });
                queryClient.setQueryData(trpc.trips.driverFindOneTripById.queryKey({ id: tripId }), updatedData);
            }
        },
        onError(error, _, oldData, context) {
            console.error(error.message);
            if (oldData) {
                context.client.setQueryData(trpc.trips.driverFindOneTripById.queryKey({ id: tripId }), oldData);
            }
        },
        onSettled(data, error, variables) { },
    });

    if (tripQuery.isPending) {
        return <Loading />
    }

    if (!tripQuery.data) {
        return <NotFoundPage routerGoBack message="Trip not found or deleted" />
    }

    const driverId = tripQuery.data.trip.bus?.driver?.id;
    const userId = userQuery.data?.id;

    if (!userId) {
        return <UnauthorizedPage />
    }
    if (!driverId || driverId !== userId) {
        return <ForbiddenPage message="This trip is not assigned to you" />
    }

    const onCheckInChange = (e: ChangeEvent<HTMLInputElement>, bookingId: string) => {
        const checked = e.target.checked;
        const existingTimer = debounceTimersRef.current.get(bookingId);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        const timer = setTimeout(() => {
            checkInMutation.mutate({
                bookingId,
                checkedIn: checked,
            });

            debounceTimersRef.current.delete(bookingId);
        }, 100);
        debounceTimersRef.current.set(bookingId, timer);
    }

    const trip = tripQuery.data.trip;
    const users = tripQuery.data.users;

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-[2rem] text-text dark:text-text font-bold mb-8 text-center">Manage Trip</h1>
            <button
                onClick={() => {
                    if (window.history.length > 1) router.back();
                    else router.push('/driver');
                }}
                className="text-accent dark:text-accent mb-8 hover:underline w-fit hover:cursor-pointer"
            >
                Go back
            </button>
            <div className="flex-1 flex flex-col justify-between">
                <Card>
                    <CardBody>
                        <div className="flex-1 grid sm:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
                            <div className="grid grid-rows-subgrid gap-2 row-span-3 text-text dark:text-text font-semibold">
                                <div className="text-secondary-text dark:text-secondary-text text-sm">From</div>
                                <div className="">{trip.route.origin.name}</div>
                            </div>
                            <div className="grid grid-rows-subgrid gap-2 row-span-3 text-text dark:text-text font-semibold">
                                <div className="text-secondary-text dark:text-secondary-text text-sm">To</div>
                                <div className="">{trip.route.destination.name}</div>
                            </div>
                            <div className="grid grid-rows-subgrid gap-2 row-span-3 text-text dark:text-text font-semibold">
                                <div className="text-secondary-text dark:text-secondary-text text-sm">Departure Time</div>
                                <div className="">{formatVNWithAMPM(new Date(trip.departureTime))}</div>
                            </div>
                            <div className="grid grid-rows-subgrid gap-2 row-span-3 text-text dark:text-text font-semibold">
                                <div className="text-secondary-text dark:text-secondary-text text-sm">Arrival Time</div>
                                <div className="">{formatVNWithAMPM(new Date(trip.arrivalTime))}</div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <div className="flex flex-col gap-8 mb-24">
                    <form className="space-y-4">
                        <SelectDropdown
                            value={{ value: tripStatus, label: tripStatus }}
                            options={Object.entries(TripStatusEnum).map((v) => ({
                                label: v[0],
                                value: v[0],
                            }))}
                            onFocus={() => {
                                setStatusUpdateSuccess(false);
                                setStatusUpdateError(false);
                            }}
                            onBlur={() => {
                                setStatusUpdateSuccess(false);
                                setStatusUpdateError(false);
                            }}
                            onChange={(newVal) => {
                                const newValue: OptionType<string> = newVal as OptionType<string>;
                                if (newValue) {
                                    setTripStatus(newValue.value as TripStatusEnum);
                                }
                            }}
                        />
                        <Button fullWidth variant="accent"
                            onClick={(e) => {
                                e.preventDefault();
                                updateTripMutation.mutate({
                                    id: tripId,
                                    status: tripStatus,
                                });
                            }}
                            disabled={tripStatus === trip.status}
                        >
                            Update Trip Status
                        </Button>
                        {statusUpdateSuccess && (
                            <div className="
                            bg-success/20 dark:bg-success/20
                            border border-success dark:border-success 
                            rounded-lg w-full p-2
                            flex items-center justify-center gap-x-2
                            "
                            >
                                <CheckIcon className="text-success dark:text-success" />
                                <h1 className="text-success dark:text-success font-semibold text-center">Trip Status Updated</h1>
                            </div>
                        )}
                        {statusUpdateError && updateTripMutation.isError && (
                            <div className="
                            bg-danger/20 dark:bg-danger/20
                            border border-danger dark:border-danger 
                            rounded-lg w-full p-2
                            flex items-center justify-center gap-x-2
                            "
                            >
                                <CancelIcon className="text-danger dark:text-danger" />
                                <h1 className="text-danger dark:text-danger font-semibold text-center">{updateTripMutation.error.message}</h1>
                            </div>
                        )}
                    </form>
                    <Button fullWidth variant="primary"
                        onClick={() => setOpenCheckIn(true)}
                    >
                        Check In Customer
                    </Button>
                </div>
            </div>
            <Modal open={openCheckIn} onClose={() => setOpenCheckIn(false)}>
                <div className="bg-secondary h-[80vh] w-[80vw] p-4 rounded-xl flex flex-col justify-between"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={`text-text dark:text-text text-center font-semibold ${trip.status === TripStatusEnum.UPCOMING && 'mb-4'}`}>Check In Customer</div>
                    {trip.status !== TripStatusEnum.UPCOMING && (
                        <div className="text-secondary-text dark:text-secondary-text mb-4 text-center">Trip {trip.status.toLowerCase()}, can no longer check in</div>
                    )}
                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                        {users.filter(u => {
                            const q = searchCustomerQuery.toLowerCase().trim();
                            return u.name.toLowerCase().includes(q);
                        }).map(user => (
                            <div key={user.bookingId}
                                className="bg-primary py-2 px-4 rounded-xl"
                            >
                                <label className="space-y-2" htmlFor={`checked-in-${user.bookingId}`}>
                                    <div className="text-text dark:text-text font-semibold">{user.name}</div>
                                    <div className="text-secondary-text dark:text-secondary-text">{user.email}</div>
                                    <div className="text-secondary-text dark:text-secondary-text">{user.phone}</div>
                                    <div className="flex gap-2">
                                        {user.seats.map(seat => (
                                            <div key={seat.code}
                                                className="text-text dark:text-text bg-accent dark:bg-accent px-2 py-1 rounded-lg"
                                            >
                                                {seat.code}
                                            </div>
                                        ))}
                                    </div>
                                </label>
                                <div className="mt-2">
                                    <Checkbox title={`${user.checkedIn ? 'Checked In' : 'Check In'}`}
                                        id={`checked-in-${user.bookingId}`}
                                        disabled={trip.status !== TripStatusEnum.UPCOMING}
                                        onChange={(e) => {
                                            onCheckInChange(e, user.bookingId);
                                        }}
                                        checked={user.checkedIn}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-text dark:text-text items-end mt-2 sticky bottom-4">
                        <FormField type="text" className="w-full" label="Search Name"
                            value={searchCustomerQuery}
                            onChange={(e) => setSearchCustomerQuery(e.target.value)}
                            placeholder="Customer Name"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}