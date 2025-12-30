"use client"
import { Card, CardBody } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { useTRPC } from "@/src/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import useUser from "@/src/hooks/useUser";
import Loading from "@/src/components/ui/loading";
import { formatVNWithAMPM } from "@/src/utils/format-time";
import { BusIcon } from "@/src/components/icons/bus-ic";
import { SelectDropdown, OptionType } from "@/src/components/ui/select-dropdown";
import Pagination from "@/src/components/ui/pagination";
import { TripStatusEnum } from "@repo/shared";
import { useState } from "react";
import Link from "next/link";

export default function DriverDashboard() {
    const trpc = useTRPC();
    const perPage = 10;
    const { data: user, isLoading: userLoading } = useUser();
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<TripStatusEnum | undefined>(undefined);

    // Fetch driver's trips
    const tripsQuery = useQuery({
        ...trpc.trips.driverSearchTrips.queryOptions({
            page: currentPage,
            perPage,
            status: statusFilter,
        }),
        staleTime: 5 * 60 * 1000,
    });

    if (userLoading || tripsQuery.isLoading) {
        return <Loading />;
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case TripStatusEnum.UPCOMING:
                return "bg-success/20 text-success";
            case TripStatusEnum.DEPARTED:
                return "bg-info/20 text-info";
            case TripStatusEnum.ARRIVED:
                return "bg-accent/20 text-accent";
            case TripStatusEnum.CANCELLED:
                return "bg-error/20 text-error";
            default:
                return "bg-secondary-text/20 text-secondary-text";
        }
    };

    const statusOptions: OptionType<TripStatusEnum | "ALL">[] = [
        { value: "ALL", label: "All Status" },
        { value: TripStatusEnum.UPCOMING, label: "Upcoming" },
        { value: TripStatusEnum.DEPARTED, label: "Departed" },
        { value: TripStatusEnum.ARRIVED, label: "Arrived" },
        { value: TripStatusEnum.CANCELLED, label: "Cancelled" },
    ];

    const trips = tripsQuery.data?.data || [];
    const totalPage = tripsQuery.data?.totalPage || 1;

    return (
        <div className="w-full min-h-screen bg-background">
            <div className="max-w-6xl mx-auto py-4 sm:py-8 lg:px-4">
                <div className="mb-6 sm:mb-8 px-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">
                        Driver Dashboard
                    </h1>
                    <p className="text-secondary-text">
                        Welcome, {user?.name}. Here are your trips.
                    </p>
                </div>

                {/* Filter Section */}
                <div className="mb-4 px-4">
                    <div className="max-w-xs">
                        <SelectDropdown
                            label="Filter by Status"
                            options={statusOptions}
                            value={statusOptions.find(opt => opt.value === (statusFilter || "ALL"))}
                            onChange={(option) => {
                                const selected = option as OptionType<TripStatusEnum | "ALL">;
                                setStatusFilter(selected.value === "ALL" ? undefined : selected.value as TripStatusEnum);
                                setCurrentPage(1);
                            }}
                            placeholder="Select status..."
                        />
                    </div>
                </div>

                {/* Trips List */}
                {trips.length === 0 ? (
                    <div className="px-4">
                        <Card>
                            <CardBody className="text-center py-12">
                                <svg
                                    className="w-16 h-16 mx-auto text-secondary-text mb-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                </svg>
                                <h3 className="text-lg font-semibold text-text mb-2">
                                    No trips found
                                </h3>
                                <p className="text-secondary-text">
                                    No trips match your current filter criteria.
                                </p>
                            </CardBody>
                        </Card>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 px-4">
                        {trips.map((trip) => (
                            <Link
                                key={trip.id}
                                href={`/driver/trips/${trip.id}`}
                            >
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                                    <CardBody padding="md">
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            {/* Left: Trip Info */}
                                            <div className="flex-1">
                                                {/* Date and Status */}
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-2">
                                                    <h3 className="text-base sm:text-lg font-bold text-text">
                                                        {formatDate(trip.departureTime)}
                                                    </h3>
                                                    <p className={`inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-semibold text-xs sm:text-sm ${getStatusColor(trip.status)}`}>
                                                        {trip.status}
                                                    </p>
                                                </div>

                                                {/* Route and Times */}
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

                                                {/* Bus and Distance Info */}
                                                <div className="flex gap-4 mt-2">
                                                    <div className="flex items-center gap-1.5 text-secondary-text">
                                                        <BusIcon />
                                                        <span className="font-medium text-text">
                                                            {trip.bus?.type?.name}
                                                        </span>
                                                    </div>
                                                    <div className="text-secondary-text">•</div>
                                                    <div className="flex items-center gap-1.5 text-secondary-text">
                                                        <span>
                                                            {trip.route?.distanceKm} km
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Action Button */}
                                            <div className="block pt-4 lg:pt-0">
                                                <Button
                                                    variant="accent"
                                                    size="sm"
                                                    fullWidth
                                                    className="whitespace-nowrap px-3 sm:px-4"
                                                >
                                                    View
                                                </Button>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Link>
                        ))}

                        {/* Pagination */}
                        {totalPage > 1 && (
                            <div className="flex justify-center py-4">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPage={totalPage}
                                    loadPageFn={setCurrentPage}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
