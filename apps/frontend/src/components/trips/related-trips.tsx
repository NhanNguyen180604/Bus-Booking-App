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
            <CardBody className="space-y-4">
                {trips.map((trip) => (
                    <div
                        key={trip.id}
                        className="border border-border rounded-lg p-4 hover:shadow-md hover:border-accent transition-all cursor-pointer"
                        onClick={() => router.push(`/trips/${trip.id}`)}
                    >
                        <div className="flex justify-between items-center gap-4">
                            {/* Trip Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-6 mb-3">
                                    {/* Departure */}
                                    <div className="text-center min-w-16">
                                        <div className="text-2xl font-semibold text-text">
                                            {getTime(trip.departureTime)}
                                        </div>
                                        <div className="text-xs text-secondary-text mt-1">
                                            {trip.route.origin.name}
                                        </div>
                                    </div>

                                    {/* Duration */}
                                    <div className="flex-1 flex flex-col items-center">
                                        <div className="text-xs text-secondary-text mb-1">
                                            {calculateDuration(trip.departureTime, trip.arrivalTime)}
                                        </div>
                                        <div className="w-full h-px bg-border relative">
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-secondary px-1">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="text-accent"
                                                >
                                                    <path d="M8 6v6" />
                                                    <path d="M15 6v6" />
                                                    <path d="M2 12h19.6" />
                                                    <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
                                                    <circle cx="7" cy="18" r="2" />
                                                    <circle cx="17" cy="18" r="2" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arrival */}
                                    <div className="text-center min-w-16">
                                        <div className="text-2xl font-semibold text-text">
                                            {getTime(trip.arrivalTime)}
                                        </div>
                                        <div className="text-xs text-secondary-text mt-1">
                                            {trip.route.destination.name}
                                        </div>
                                    </div>
                                </div>

                                {/* Date and Bus Details */}
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="text-secondary-text">
                                        {getDate(trip.departureTime)}
                                    </div>
                                    <div className="text-secondary-text">•</div>
                                    <div className="flex items-center gap-1.5 text-secondary-text">
                                        <Image src={"/icons/bus-ic.svg"} alt="bus icon" width={20} height={20} />
                                        <span className="font-medium text-text">{trip.bus.type.name}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Price and Button */}
                            <div className="text-right">
                                <div className="text-2xl font-bold text-accent mb-2">
                                    {formatPrice(trip.basePrice)}
                                </div>
                                <Button variant="accent" size="sm">
                                    View Details
                                </Button>
                            </div>
                        </div>
                    </div>
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
