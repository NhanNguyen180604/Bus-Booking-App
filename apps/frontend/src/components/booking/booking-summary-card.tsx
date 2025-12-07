"use client"
import { formatVNWithAMPM } from "@/src/utils/format-time";
import { Card, CardBody, CardHeader } from "../ui/card";
import { formatPrice } from "@/src/utils/format-price";
import { useTRPC } from "@/src/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Loading from "../ui/loading";

interface BookingSummaryCardProps {
    tripId: string;
    seatIds: string[];
};

export default function BookingSummaryCard({ tripId, seatIds }: BookingSummaryCardProps) {
    const trpc = useTRPC();

    const tripQueryOpts = trpc.trips.findOneById.queryOptions({ id: tripId });
    const tripQuery = useQuery({
        ...tripQueryOpts,
        staleTime: 60 * 60 * 1000,
    });

    const seatQueryOpts = trpc.buses.getSeatsByIds.queryOptions({ ids: seatIds });
    const seatQuery = useQuery({
        ...seatQueryOpts,
        staleTime: 60 * 60 * 1000,
    });

    if (seatQuery.isLoading || tripQuery.isLoading) {
        return <Card>
            <Loading></Loading>
        </Card>
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-text">
                        Booking Summary
                    </h3>
                </CardHeader>
                <CardBody>
                    <div className='space-y-4 border-b border-border dark:border-border'>
                        {/* Trip Info */}
                        <div className='grid grid-cols-12'>
                            <div className='text-secondary-text dark:text-secondary-text text-sm col-span-6'>From</div>
                            <div className='text-secondary-text dark:text-secondary-text text-sm col-span-6 text-end'>To</div>
                            <div className='text-text dark:text-text font-semibold col-span-6 mb-2'>
                                {tripQuery.data?.route.origin.name}
                            </div>
                            <div className='text-text dark:text-text font-semibold col-span-6 mb-2 text-end'>
                                {tripQuery.data?.route.destination.name}
                            </div>

                            <div className='text-secondary-text dark:text-secondary-text text-sm col-span-6'>Departure Time</div>
                            <div className='text-secondary-text dark:text-secondary-text text-sm col-span-6 text-end'>Arrival Time</div>
                            <div className='text-text dark:text-text font-semibold col-span-6 mb-2'>
                                {formatVNWithAMPM(new Date(tripQuery.data?.departureTime ?? Date.now()))}
                            </div>
                            <div className='text-text dark:text-text font-semibold col-span-6 mb-2 text-end'>
                                {formatVNWithAMPM(new Date(tripQuery.data?.arrivalTime ?? Date.now()))}
                            </div>

                            <div className='text-secondary-text dark:text-secondary-text text-sm col-span-12'>Distance (km)</div>
                            <div className='text-text dark:text-text font-semibold col-span-12 mb-2'>
                                {tripQuery.data?.route.distanceKm} km
                            </div>
                        </div>
                    </div>
                </CardBody>
                <CardBody>
                    <div className='space-y-4'>
                        {/* Selected Seats */}
                        <div className='grid grid-cols-12'>
                            <div className="text-sm text-secondary-text dark:text-secondary-text mb-2 col-span-12">
                                Bus Type: <span className='text-text dark:text-text'>{tripQuery.data?.bus.type.name}</span>
                            </div>
                            <div className="text-sm text-secondary-text mb-2 col-span-6">
                                Selected Seats
                            </div>
                            <div className='flex gap-2 col-span-12'>
                                {seatQuery.data?.map((seat) => (
                                    <span key={seat.id}
                                        className='px-3 py-1 bg-accent/10 dark:bg-accent/10 text-accent dark:text-accent rounded-full text-sm font-medium'
                                    >
                                        {seat.code}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-border pt-4 space-y-3">
                            {/* Price per seat */}
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary-text">Price per seat</span>
                                <span className="font-medium text-text">
                                    {tripQuery.data?.basePrice ? formatPrice(tripQuery.data.basePrice) : 'Loading...'}
                                </span>
                            </div>

                            {/* Number of seats */}
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary-text">
                                    Number of seats
                                </span>
                                <span className="font-medium text-text">
                                    {seatQuery.data ? seatQuery.data?.length : 'Loading...'}
                                </span>
                            </div>

                            {/* Total */}
                            <div className="flex justify-between text-lg font-bold border-t border-border pt-3">
                                <span className="text-text">Total</span>
                                <span className="text-accent">
                                    {tripQuery.data?.basePrice && seatQuery.data?.length ? formatPrice(tripQuery.data.basePrice * seatQuery.data.length) : 'Loading...'}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </>
    );
}