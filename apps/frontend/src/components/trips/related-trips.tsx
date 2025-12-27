"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/src/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Pagination from "../ui/pagination";
import Image from "next/image";
import { formatPrice } from "@/src/utils/format-price";
import { BusIcon2 } from "../icons/bus2-ic";
import Link from "next/link";

interface RelatedTripsProps {
    routeId: string;
    excludeTripId?: string;
    className?: string;
}

export function RelatedTrips({ routeId, excludeTripId, className = "" }: RelatedTripsProps) {
    const router = useRouter();
    const trpc = useTRPC();
    const [currentPage, setCurrentPage] = useState(1);

    const relatedTripsQuery = useQuery({
        ...trpc.trips.relatedTrips.queryOptions({
            routeId,
            excludeTripId,
            page: currentPage,
            perPage: 5,
        }),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const getTime = (date: string) => {
        return new Date(date).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const getDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const calculateDuration = (start: string, end: string) => {
        const diff = new Date(end).getTime() - new Date(start).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    if (relatedTripsQuery.isLoading) {
        return (
            <Card className={className}>
                <CardHeader className="border-b border-border">
                    <div className="h-7 bg-text/10 rounded w-48 animate-pulse"></div>
                </CardHeader>
                <CardBody className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="border border-border rounded-lg p-4">
                            <div className="flex justify-between items-center gap-4">
                                <div className="flex-1 space-y-3">
                                    <div className="flex gap-6">
                                        <div className="h-12 bg-text/10 rounded w-20 animate-pulse"></div>
                                        <div className="h-12 bg-text/10 rounded flex-1 animate-pulse"></div>
                                        <div className="h-12 bg-text/10 rounded w-20 animate-pulse"></div>
                                    </div>
                                    <div className="h-4 bg-text/10 rounded w-48 animate-pulse"></div>
                                </div>
                                <div className="h-10 bg-text/10 rounded w-24 animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </CardBody>
            </Card>
        );
    }

    if (relatedTripsQuery.isError || !relatedTripsQuery.data) {
        return null;
    }

    const trips = relatedTripsQuery.data.data;

    if (trips.length === 0) {
        return null;
    }

    return (
        <Card className={className}>
            <CardHeader className="border-b border-border">
                <h3 className="text-xl font-semibold text-text">Related Trips</h3>
                <p className="text-sm text-secondary-text mt-1">
                    Other upcoming trips on this route
                </p>
            </CardHeader>
            <CardBody className="flex flex-col gap-4">
                {trips.map((trip) => (
                    <Link href={`/trips/${trip.id}`} key={trip.id}>
                        <div
                            className="
                                border border-border rounded-lg p-4
                                hover:shadow-md hover:border-accent transition-all cursor-pointer
                                flex flex-col justify-between gap-4
                            "
                            key={trip.id}
                        >
                            {/* Trip Info */}
                            <div className="
                                flex-1 grid 
                                grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)]
                                md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]
                                lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] 
                                gap-2 lg:gap-4
                            ">
                                {/* Departure */}
                                <div className="grid grid-rows-subgrid gap-2 row-span-2 text-text dark:text-text font-semibold">
                                    <div className="text-xl md:text-2xl font-semibold text-text">
                                        {getTime(trip.departureTime)}
                                    </div>
                                    <div className="text-xs text-secondary-text mt-1">
                                        {trip.route.origin.name}
                                    </div>
                                </div>

                                {/* Duration */}
                                <div className="row-span-2 self-center">
                                    <div className="flex-1 flex flex-col items-center justify-center">
                                        <div className="text-sm text-secondary-text mb-3">
                                            {calculateDuration(trip.departureTime, trip.arrivalTime)}
                                        </div>
                                        <div className="w-full relative">
                                            <div className="h-px bg-border"></div>
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-2">
                                                <BusIcon2 />
                                            </div>
                                        </div>
                                        <div className="text-sm text-secondary-text mt-3">
                                            {trip.route.distanceKm} km
                                        </div>
                                    </div>
                                </div>

                                {/* Arrival */}
                                <div className="grid grid-rows-subgrid gap-2 row-span-2 text-end text-text dark:text-text font-semibold">
                                    <div className="text-xl md:text-2xl font-semibold text-text">
                                        {getTime(trip.arrivalTime)}
                                    </div>
                                    <div className="text-xs text-secondary-text mt-1">
                                        {trip.route.destination.name}
                                    </div>
                                </div>

                                {/* Date and Bus Details */}
                                <div className="hidden md:grid grid-rows-subgrid gap-2 row-span-2 text-end text-sm">
                                    <div className="text-secondary-text">
                                        {getDate(trip.departureTime)}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-secondary-text justify-end">
                                        <Image src={"/icons/bus-ic.svg"} alt="bus icon" width={20} height={20} />
                                        <span className="font-medium text-text">{trip.bus.type.name}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="md:hidden flex justify-between text-sm">
                                <div className="text-secondary-text">
                                    {getDate(trip.departureTime)}
                                </div>
                                <div className="flex items-center gap-1.5 text-secondary-text justify-end">
                                    <Image src={"/icons/bus-ic.svg"} alt="bus icon" width={20} height={20} />
                                    <span className="font-medium text-text">{trip.bus.type.name}</span>
                                </div>
                            </div>

                            {/* Price and Button */}
                            <div className="flex flex-col md:flex-row justify-end md:gap-16 mt-2">
                                <div className="text-2xl font-bold text-accent mb-2 text-end">
                                    {formatPrice(trip.basePrice)}
                                </div>
                                <Button variant="accent" size="sm" className="md:flex-1">
                                    View Details
                                </Button>
                            </div>
                        </div>
                    </Link>
                ))}

                {relatedTripsQuery.data.totalPage > 1 && (
                    <div className="flex justify-center pt-4 border-t border-border">
                        <Pagination
                            currentPage={relatedTripsQuery.data.page}
                            totalPage={relatedTripsQuery.data.totalPage}
                            loadPageFn={setCurrentPage}
                        />
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
