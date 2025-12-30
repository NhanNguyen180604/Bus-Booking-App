"use client";;
import { Card, CardBody } from "../ui/card";
import { Button } from "../ui/button";
import { type RouterOutputsType } from "backend";
import Pagination from "../ui/pagination";
import { formatPrice } from "@/src/utils/format-price";
import { SeatTypeEnum } from "@repo/shared";
import Link from "next/link";
import { BusIcon2 } from "../icons/bus2-ic";

type FindTripResults = RouterOutputsType["trips"]["search"];
type Bus = FindTripResults["trips"][0]["bus"];

interface SearchResultsProps {
  results: FindTripResults | null;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function SearchResults({
  results,
  isLoading,
  onPageChange,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  if (!results || results.trips.length === 0) {
    return (
      <div className="w-full">
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-4 text-secondary-text"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <h3 className="text-lg font-semibold text-text mb-2">
                No trips found
              </h3>
              <p className="text-secondary-text">
                Try adjusting your search criteria
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const getTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const calculateDuration = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const calculateSeats = (bus: Bus) => {
    return bus.seats.filter(s => s.seatType === SeatTypeEnum.PASSENGER && s.isActive).length;
  };

  return (
    <div className="w-full space-y-4">
      {/* Results Header */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xl font-semibold text-text">
          {results.total} trip{results.total > 1 ? 's' : ''} available
        </h2>
      </div>

      {/* Trip List */}
      <div className="flex flex-col gap-4">
        {results.trips.map((trip) => {
          const totalSeats = calculateSeats(trip.bus);

          return (
            <Link href={`/trips/${trip.id}`} key={trip.id}>
              <Card
                variant="default"
                className='transition-all hover:shadow-md hover:cursor-pointer px-6 py-4 flex flex-col gap-4'
              >
                <div className="
                  flex-1 grid 
                  grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)]
                  md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]
                  lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)_minmax(0,3fr)] 
                  gap-2 lg:gap-4
                ">
                  <div className="grid grid-rows-subgrid gap-2 row-span-2 text-text dark:text-text font-semibold">
                    <div className="text-sm">{trip.route.origin.name.toUpperCase()}</div>
                    <div className="text-lg">{getTime(trip.departureTime)}</div>
                  </div>
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
                  <div className="grid grid-rows-subgrid gap-2 row-span-2 text-text dark:text-text font-semibold">
                    <div className="text-sm text-end">{trip.route.destination.name.toUpperCase()}</div>
                    <div className="text-lg text-end">{getTime(trip.arrivalTime)}</div>
                  </div>
                  <div className="hidden lg:grid grid-rows-subgrid gap-2 row-span-2">
                    <div className="text-secondary-text dark:text-secondary-text text-end">
                      {trip.bus.type.name} - {totalSeats} seat{totalSeats > 1 ? 's' : ''}
                    </div>
                    <div className="text-accent dark:text-accent font-bold text-xl text-end">
                      {formatPrice(trip.basePrice)}
                    </div>
                  </div>
                </div>
                <div className="lg:hidden flex justify-between">
                  <div className="text-secondary-text dark:text-secondary-text">
                    <div>{trip.bus.type.name}</div>
                    <div>{totalSeats} seat{totalSeats > 1 ? 's' : ''}</div>
                  </div>
                  <div className="text-accent dark:text-accent font-bold text-xl text-end self-center">
                    {formatPrice(trip.basePrice)}
                  </div>
                </div>
                <Button variant="accent" className="col-span-8">
                  Book Now
                </Button>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {results.totalPage > 1 && (
        <div className="flex items-center justify-center py-4">
          <Pagination
            currentPage={results.page}
            totalPage={results.totalPage}
            loadPageFn={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
