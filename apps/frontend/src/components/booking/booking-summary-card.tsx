"use client"
import { formatVNWithAMPM } from "@/src/utils/format-time";
import { Card, CardBody, CardFooter, CardHeader } from "../ui/card";
import { formatPrice } from "@/src/utils/format-price";
import { RouterOutputsType } from "backend";
import { Button } from "../ui/button";

type Trip = RouterOutputsType['trips']['findOneById'];
type Seat = RouterOutputsType["buses"]["getSeatsByBus"][number];

interface BookingSummaryCardProps extends React.HTMLAttributes<HTMLDivElement> {
    trip: Trip;
    selectedSeats: Seat[];
    onPaymentClick?: () => void;
};

export default function BookingSummaryCard({ trip, selectedSeats, className = "", onPaymentClick = () => { } }: BookingSummaryCardProps) {
    if (!trip)
        return null;

    return (
        <>
            <Card className={className}>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-text">
                        Booking Summary
                    </h3>
                </CardHeader>
                <CardBody>
                    <div className='space-y-4'>
                        {/* Trip Info */}
                        <div className='grid grid-cols-12'>
                            <div className='text-secondary-text dark:text-secondary-text text-sm col-span-6'>From</div>
                            <div className='text-secondary-text dark:text-secondary-text text-sm col-span-6 text-end'>To</div>
                            <div className='text-text dark:text-text font-semibold col-span-6 mb-2'>
                                {trip.route.origin.name}
                            </div>
                            <div className='text-text dark:text-text font-semibold col-span-6 mb-2 text-end'>
                                {trip.route.destination.name}
                            </div>

                            <div className='text-secondary-text dark:text-secondary-text text-sm col-span-6'>Departure Time</div>
                            <div className='text-secondary-text dark:text-secondary-text text-sm col-span-6 text-end'>Distance (km)</div>
                            <div className='text-text dark:text-text font-semibold col-span-6 mb-2'>
                                {formatVNWithAMPM(new Date(trip.departureTime ?? Date.now()))}
                            </div>
                            <div className='text-text dark:text-text font-semibold col-span-6 mb-2 text-end'>
                                {trip.route.distanceKm} km
                            </div>
                        </div>

                        {/* Selected Seats */}
                        <div className='grid grid-cols-12'>
                            <div className="text-sm text-secondary-text mb-2 col-span-6">
                                Selected Seats
                            </div>
                            <div className='flex flex-wrap gap-2 col-span-12'>
                                {selectedSeats.map((seat) => (
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
                                    {formatPrice(trip.basePrice)}
                                </span>
                            </div>

                            {/* Number of seats */}
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary-text">
                                    Number of seats
                                </span>
                                <span className="font-medium text-text">
                                    {selectedSeats.length}
                                </span>
                            </div>

                            {/* Total */}
                            <div className="flex justify-between text-lg font-bold border-t border-border pt-3">
                                <span className="text-text">Total</span>
                                <span className="text-accent">
                                    {formatPrice(trip.basePrice * selectedSeats.length)}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardBody>

                <CardFooter className="rounded-lg">
                    {/* Proceed Button */}
                    <Button
                        variant="accent"
                        size="lg"
                        fullWidth
                        disabled={selectedSeats.length === 0}
                        className="mt-6 transition"
                        onClick={onPaymentClick}
                    >
                        Continue
                    </Button>

                    {/* Info */}
                    <div className="text-xs text-secondary-text text-center mt-4">
                        Select at least one seat to continue
                    </div>
                </CardFooter>
            </Card>
        </>
    );
}