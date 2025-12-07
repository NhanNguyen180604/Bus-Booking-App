"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { RouterOutputsType } from "backend";
import Image from "next/image";
import { SeatTypeEnum } from "@repo/shared";

type Trip = RouterOutputsType["trips"]["findOneById"];
type Seat = Omit<RouterOutputsType["buses"]["getSeatsByBus"][0], "bus">;

export function TripDetail({ trip }: { trip: Trip }) {
  const router = useRouter();
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

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

  const totalPrice = trip!.basePrice * trip!.bus.type.priceMultiplier;
  const totalSeats = trip!.bus.rows * trip!.bus.cols * trip!.bus.floors;

  // Generate seat layout (mock data for now)
  const generateSeatLayout = (floor: number) => {
    const seats: Array<Seat> = [];

    for (let row = 0; row < trip!.bus.rows; row++) {
      for (let col = 0; col < trip!.bus.cols; col++) {
        const isAisle = trip!.bus.cols >= 4 && col === Math.floor(trip!.bus.cols / 2);

        const isDriver = floor === 0 && row === 0 && col === 0;

        if (!isAisle && !isDriver) {
          const seatCode = `${String.fromCharCode(65 + floor)}${row + 1}${col + 1}`;
          seats.push({
            id: seatCode,
            row,
            col,
            floor,
            code: seatCode,
            seatType: SeatTypeEnum.PASSENGER,
            isActive: true,
          });
        } else if (isDriver) {
          seats.push({
            id: "Driver",
            row,
            col,
            floor,
            code: "DRIVER",
            seatType: SeatTypeEnum.DRIVER,
            isActive: false,
          });
        }
      }
    }

    return seats;
  };

  const seats = generateSeatLayout(selectedFloor);

  const toggleSeat = (seatCode: string) => {
    if (selectedSeats.includes(seatCode)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatCode));
    } else {
      setSelectedSeats([...selectedSeats, seatCode]);
    }
  };

  const getSeatStatus = (seat: Seat) => {
    if (seat.row === 0 && seat.col === 0) return "driver";
    if (selectedSeats.includes(seat.code)) return "selected";
    if (!seat.isActive) return "booked";
    return "available";
  };

  const getSeatClassName = (status: string) => {
    const base = "w-12 h-12 rounded-lg transition-all flex items-center justify-center text-xs font-semibold border-2";

    switch (status) {
      case "available":
        return `${base} bg-primary hover:bg-accent/10 border-text/10 text-text hover:border-accent cursor-pointer hover:scale-105`;
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
    <div className="max-w-7xl mx-auto py-8 px-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-accent hover:text-accent/80 mb-6"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Results
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Seat Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Trip Info Header */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text">
                      {formatTime(trip!.departureTime)}
                    </div>
                    <div className="text-sm text-secondary-text">
                      {trip!.route.origin.name}
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="text-sm text-secondary-text mb-3">
                      {calculateDuration(trip!.departureTime, trip!.arrivalTime)}
                    </div>
                    <div className="w-69 h-px bg-border relative">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-secondary px-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
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
                    <div className="text-sm text-secondary-text mt-3">
                      {trip!.route.distanceKm} km
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-text">
                      {formatTime(trip!.arrivalTime)}
                    </div>
                    <div className="text-sm text-secondary-text">
                      {trip!.route.destination.name}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-secondary-text">
                    {formatDate(trip!.departureTime)}
                  </div>
                  <div className="text-sm font-medium text-text">
                    {trip!.bus.type.name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-secondary-text border-t border-border pt-4">
                <div className="flex items-center gap-1.5">
                  <Image src={"/icons/plate-ic.svg"} alt={`plate icon`} width={24} height={24} />
                  Plate: {trip!.bus.plateNumber}
                </div>
                <div>•</div>
                <div className="flex items-center gap-1.5">
                  <Image src={"/icons/seat-ic.svg"} alt={`seat icon`} width={24} height={24} />
                  {totalSeats} seats</div>
                <div>•</div>
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
            <CardBody>
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-primary border-2 border-text/10"></div>
                  <span className="text-sm text-secondary-text">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-accent"></div>
                  <span className="text-sm text-secondary-text">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-text/10 border-2 border-secondary-text"></div>
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
                <div className="inline-block bg-linear-to-b from-secondary/40 to-secondary/20 p-8 rounded-2xl border-2 border-border shadow-inner">
                  <div className="text-center text-sm text-text font-semibold mb-6 flex items-center justify-center gap-2 bg-primary/50 py-2 px-4 rounded-lg">
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
                    FRONT OF BUS
                  </div>
                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns: `repeat(${trip!.bus.cols}, minmax(0, 1fr))`,
                    }}
                  >
                    {seats.map((seat, index) => {
                      const status = getSeatStatus(seat);
                      return (
                        <div
                          key={index}
                          className="flex justify-between items-center">
                          <button
                            className={getSeatClassName(status)}
                            onClick={() =>
                              (status === "available" || status === "selected") && toggleSeat(seat.id)
                            }
                            disabled={
                              status === "booked" || status === "driver"
                            }
                            title={seat.id}
                          >
                            {status === 'driver' ? (
                              <Image src={"/icons/steering-wheel.svg"} alt={`driver icon`} width={24} height={24} />
                            ) : (
                              seat.id
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center text-xs text-secondary-text mt-6 font-medium">
                    BACK OF BUS
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right: Booking Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <h3 className="text-lg font-semibold text-text">
                Booking Summary
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {/* Selected Seats */}
                <div>
                  <div className="text-sm text-secondary-text mb-2">
                    Selected Seats
                  </div>
                  {selectedSeats.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedSeats.map((seat) => (
                        <span
                          key={seat}
                          className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium"
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-secondary-text italic">
                      No seats selected
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  {/* Price per seat */}
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-text">Price per seat</span>
                    <span className="font-medium text-text">
                      ${totalPrice.toFixed(2)}
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
                      ${(totalPrice * selectedSeats.length).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Proceed Button */}
                <Button
                  variant="accent"
                  size="lg"
                  fullWidth
                  disabled={selectedSeats.length === 0}
                  className="mt-6"
                >
                  Proceed to Payment
                </Button>

                {/* Info */}
                <div className="text-xs text-secondary-text text-center mt-4">
                  Select at least one seat to continue
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
