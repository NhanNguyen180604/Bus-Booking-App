"use client";;
import { useState } from "react";
import { Card, CardBody, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { RouterOutputsType } from "backend";
import Image from "next/image";
import { generateSeatCode, SeatTypeEnum } from "@repo/shared";
import { useTRPC } from "@/src/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { BusIcon2 } from "../icons/bus2-ic";

type Trip = RouterOutputsType["trips"]["findOneById"];
type Seat = RouterOutputsType["buses"]["getSeatsByBus"][0];

interface TripDetailProps extends React.HTMLAttributes<HTMLDivElement> {
    trip: Trip;
    onSelectSeat: (seat: Seat) => void;
    selectedSeats: Seat[];
    seatList: Seat[];
}

export function TripDetail({ trip, onSelectSeat, selectedSeats, seatList, className = "" }: TripDetailProps) {
    const trpc = useTRPC();

    const getBookingSeatsQueryOptions = trpc.booking.getBookingSeatsByTrip.queryOptions({ tripId: trip!.id });
    const getBookingSeatsQuery = useQuery({
        ...getBookingSeatsQueryOptions,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    const [selectedFloor, setSelectedFloor] = useState(0);

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            weekday: "short",
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

    const totalSeats = seatList.length;

    // Generate seat layout
    const getSeatsAtFloor = (floor: number) => {
        const seats: Array<Seat> = seatList || [];
        return seats.filter((seat) => seat.floor === floor);
    };

    const seats = getSeatsAtFloor(selectedFloor);
    const seatMap = new Map<string, Seat>();
    seats.forEach((s) => {
        seatMap.set(generateSeatCode(s.row, s.col, s.floor), s);
    })

    const toggleSeat = (seat: Seat) => {
        onSelectSeat(seat);
    };

    type SeatStatus = "driver" | "selected" | "booked" | "available" | "unavailable" | "aisle";
    const getSeatStatus: (seat: Seat) => SeatStatus = (seat: Seat) => {
        if (seat.seatType == SeatTypeEnum.DRIVER) return "driver";
        if (selectedSeats.includes(seat)) return "selected";
        if (getBookingSeatsQuery.data?.some((bookedSeat) => bookedSeat.id === seat.id)) return "booked";
        return seat.isActive ? "available" : "unavailable";
    };

    const getSeatClassName = (status: SeatStatus) => {
        const base = "w-12 h-12 rounded-lg transition-all flex items-center justify-center text-xs font-semibold border-2";

        switch (status) {
            case "available":
                return `${base} bg-primary hover:bg-accent/10 border-text/10 text-text hover:border-accent cursor-pointer hover:scale-105`;
            case "unavailable":
                return `${base} bg-danger/10 dark:bg-danger/10 text-danger dark:text-danger border-danger cursor-not-allowed`;
            case "selected":
                return `${base} bg-accent text-white border-accent scale-105 cursor-pointer shadow-lg`;
            case "booked":
                return `${base} bg-text/10 text-text border-text cursor-not-allowed opacity-50`;
            case "driver":
                return `${base} bg-text/10 text-text border-text border-dashed cursor-not-allowed`;
            case "aisle":
                return "w-12 h-12";
            default:
                return base;
        }
    };

    return (
        <>
            {/* Left: Seat Selection */}
            <div className={`${className} space-y-4`}>
                {/* Trip Info Header */}
                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between mb-4">
                            <div className="
                                flex-1 grid 
                                grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]
                                md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]
                                lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)_minmax(0,3fr)] 
                                gap-2 lg:gap-4
                            ">
                                <div className="grid grid-rows-subgrid gap-2 row-span-2">
                                    <div className="text-xl md:text-2xl font-bold text-text">
                                        {formatTime(trip!.departureTime)}
                                    </div>
                                    <div className="text-sm text-secondary-text">
                                        {trip!.route.origin.name}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center row-span-2">
                                    <div className="text-sm text-secondary-text mb-3">
                                        {calculateDuration(trip!.departureTime, trip!.arrivalTime)}
                                    </div>
                                    <div className="w-full h-px bg-border relative">
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-secondary px-2">
                                            <BusIcon2 />
                                        </div>
                                    </div>
                                    <div className="text-sm text-secondary-text mt-3">
                                        {trip!.route.distanceKm} km
                                    </div>
                                </div>

                                <div className="grid grid-rows-subgrid gap-2 row-span-2 text-end">
                                    <div className="text-xl md:text-2xl font-bold text-text">
                                        {formatTime(trip!.arrivalTime)}
                                    </div>
                                    <div className="text-sm text-secondary-text">
                                        {trip!.route.destination.name}
                                    </div>
                                </div>

                                <div className="hidden md:grid grid-rows-subgrid gap-2 row-span-2 text-end">
                                    <div className="text-sm text-secondary-text">
                                        {formatDate(trip!.departureTime)}
                                    </div>
                                    <div className="text-sm font-medium text-text">
                                        {trip!.bus.type.name}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:hidden flex justify-between mb-4 border-t border-border pt-4">
                            <div className="text-sm text-secondary-text">
                                {formatDate(trip!.departureTime)}
                            </div>
                            <div className="text-sm font-medium text-text">
                                {trip!.bus.type.name}
                            </div>
                        </div>

                        <div className="flex flex-wrap md:flex-nowrap items-center gap-4 text-sm text-secondary-text border-t border-border pt-4">
                            <div className="flex items-center gap-1.5">
                                <Image src={"/icons/plate-ic.svg"} alt={`plate icon`} width={24} height={24} />
                                Plate: {trip!.bus.plateNumber}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Image src={"/icons/seat-ic.svg"} alt={`seat icon`} width={24} height={24} />
                                {totalSeats} seats</div>
                            <div className="flex items-center">
                                <Image src={"/icons/floor-ic.svg"} alt={`floor icon`} width={24} height={24} />
                                {trip!.bus.floors} floor{trip!.bus.floors > 1 ? "s" : ""}</div>
                        </div>
                    </CardBody>
                </Card>

                {/* Floor Selector */}
                {trip!.bus.floors > 1 && (
                    <Card>
                        <CardBody>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-text mr-2">
                                    Select Floor:
                                </span>
                                {Array.from({ length: trip!.bus.floors }, (_, i) => (
                                    <Button
                                        key={i}
                                        variant={selectedFloor === i ? "accent" : "secondary"}
                                        size="sm"
                                        onClick={() => setSelectedFloor(i)}
                                    >
                                        Floor {i + 1}
                                    </Button>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Seat Layout */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-text">
                            Select Your Seats
                        </h3>
                    </CardHeader>
                    <CardBody className="px-2 lg:px-6 py-4">
                        {/* Legend */}
                        <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-border">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-primary border-2 border-text/10"></div>
                                <span className="text-sm text-secondary-text">Available</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-danger/10 border-2 border-danger"></div>
                                <span className="text-sm text-secondary-text">Unavailable</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-accent"></div>
                                <span className="text-sm text-secondary-text">Selected</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-text/10 border-2 border-secondary-text opacity-50"></div>
                                <span className="text-sm text-secondary-text">Booked</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-text/10 border-2 border-dashed border-secondary-text flex items-center justify-center text-text">
                                    <Image src={"/icons/steering-wheel.svg"} alt={`driver icon`} width={20} height={20} />
                                </div>
                                <span className="text-sm text-secondary-text">Driver</span>
                            </div>
                        </div>

                        {/* Seat Grid */}
                        <div className="flex justify-center">
                            <div className="inline-block bg-linear-to-b from-secondary/40 to-secondary/20 p-4 lg:p-8 rounded-2xl border-2 border-border shadow-inner">
                                <div className="text-center text-sm text-text font-semibold mb-6 flex items-center justify-center gap-2 bg-primary/50 py-2 px-4 rounded-lg">
                                    <BusIcon2 />
                                    FRONT OF BUS
                                </div>

                                <div
                                    className="grid gap-4"
                                    style={{
                                        gridTemplateColumns: `repeat(${trip!.bus.cols}, minmax(0, 1fr))`,
                                    }}
                                >
                                    {Array.from({ length: trip!.bus.rows }).map((_, rowIndex) => (
                                        <React.Fragment key={`seat-row-${rowIndex}`}>
                                            {Array.from({ length: trip!.bus.cols }).map((_, colIndex) => {
                                                const seat = seatMap.get(generateSeatCode(rowIndex, colIndex, selectedFloor));
                                                const status: SeatStatus = seat ? getSeatStatus(seat) : "aisle";
                                                return (
                                                    <div
                                                        key={`seat-col-${colIndex}`}
                                                        className="flex justify-between items-center"
                                                    >
                                                        <button
                                                            className={getSeatClassName(status)}
                                                            onClick={() =>
                                                                seat && (status === "available" || status === "selected") && toggleSeat(seat)
                                                            }
                                                            disabled={
                                                                status === "booked" || status === "driver" || !seat
                                                            }
                                                            title={seat && seat.code}
                                                        >
                                                            {seat && (<>
                                                                {status === 'driver' ? (
                                                                    <Image src={"/icons/steering-wheel.svg"} alt={`driver icon`} width={24} height={24} />
                                                                ) : (
                                                                    seat.code
                                                                )}
                                                            </>)}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                                <div className="text-center text-xs text-secondary-text mt-6 font-medium">
                                    BACK OF BUS
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </>
    );
}
