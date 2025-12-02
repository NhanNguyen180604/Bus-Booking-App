"use client";

import { Card, CardBody } from "../ui/card";
import { Button } from "../ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Trip {
  id: string;
  departureTime: Date;
  arrivalTime: Date;
  basePrice: number;
  route: {
    id: string;
    origin: { id: string; name: string };
    destination: { id: string; name: string };
    distanceKm: number;
    estimatedMinutes: number;
  };
  bus: {
    id: string;
    plateNumber: string;
    rows: number;
    cols: number;
    floors: number;
    type: {
      id: string;
      name: string;
      priceMultiplier: number;
    };
  };
}

interface SearchResultsProps {
  results: {
    trips: Trip[];
    page: number;
    perPage: number;
    total: number;
    totalPage: number;
  } | null;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function SearchResults({
  results,
  isLoading,
  onPageChange,
}: SearchResultsProps) {
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const router = useRouter();

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

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateDuration = (start: Date, end: Date) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const calculateSeats = (bus: Trip["bus"]) => {
    return bus.rows * bus.cols * bus.floors;
  };

  return (
    <div className="w-full space-y-4">
      {/* Results Header */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xl font-semibold text-text">
          {results.total} trips available
        </h2>
        <div className="text-sm text-secondary-text">
          Showing page {results.page} of {results.totalPage}
        </div>
      </div>

      {/* Trip List */}
      <div className="space-y-3">
        {results.trips.map((trip) => {
          const totalPrice = trip.basePrice * trip.bus.type.priceMultiplier;
          const isSelected = selectedTrip === trip.id;
          const totalSeats = calculateSeats(trip.bus);
          
          return (
            <Card 
              key={trip.id} 
              variant="default"
              className={`transition-all hover:shadow-md ${
                isSelected ? "ring-2 ring-accent" : ""
              }`}
            >
              <CardBody padding="md">
                <div className="flex flex-col gap-4">
                  {/* Main Trip Info */}
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Time and Route */}
                    <div className="flex-1">
                      <div className="flex items-center gap-6 mb-3">
                        {/* Departure */}
                        <div className="text-center min-w-20">
                          <div className="text-3xl font-bold text-text">
                            {formatTime(trip.departureTime)}
                          </div>
                          <div className="text-sm text-secondary-text mt-1">
                            {trip.route.origin.name}
                          </div>
                        </div>

                        {/* Duration Arrow */}
                        <div className="flex-1 flex flex-col items-center justify-center min-w-[120px]">
                          <div className="text-sm text-secondary-text mb-3">
                            {calculateDuration(trip.departureTime, trip.arrivalTime)}
                          </div>
                          <div className="w-full relative">
                            <div className="h-px bg-border"></div>
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
                            {trip.route.distanceKm} km
                          </div>
                        </div>

                        {/* Arrival */}
                        <div className="text-center min-w-20">
                          <div className="text-3xl font-bold text-text">
                            {formatTime(trip.arrivalTime)}
                          </div>
                          <div className="text-sm text-secondary-text mt-1">
                            {trip.route.destination.name}
                          </div>
                        </div>
                      </div>

                      {/* Bus Details */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center gap-1.5 text-secondary-text">
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
                          >
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <path d="M9 3v18" />
                            <path d="M15 3v18" />
                            <path d="M3 9h18" />
                            <path d="M3 15h18" />
                          </svg>
                          <span className="font-medium text-text">{trip.bus.type.name}</span>
                        </div>
                        <div className="text-secondary-text">•</div>
                        <div className="flex items-center gap-1.5 text-secondary-text">
                          <span>{totalSeats} seats</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Price and Action */}
                    <div className="flex flex-col items-end justify-between min-w-40">
                      <div className="text-right mb-4">
                        <div className="text-sm font-bold text-text uppercase tracking-wide mb-1">
                          Price
                        </div>
                        <div className="text-3xl font-bold text-accent">
                          ${totalPrice.toFixed(2)}
                        </div>
                        <div className="text-xs text-secondary-text mt-0.5">
                          per seat
                        </div>
                      </div>
                      <Button
                        variant="accent"
                        size="lg"
                        fullWidth
                        onClick={() => router.push(`/trips/${trip.id}`)}
                      >
                        Booking
                      </Button>
                    </div>
                  </div>

                  {/* Additional Info - Collapsible */}
                  {isSelected && (
                    <div className="pt-4 border-t border-border">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-secondary-text mb-1">Departure Date</div>
                          <div className="font-medium text-text">
                            {formatDate(trip.departureTime)}
                          </div>
                        </div>
                        <div>
                          <div className="text-secondary-text mb-1">Estimated Arrival</div>
                          <div className="font-medium text-text">
                            {formatDate(trip.arrivalTime)}
                          </div>
                        </div>
                        <div>
                          <div className="text-secondary-text mb-1">Bus Layout</div>
                          <div className="font-medium text-text">
                            {trip.bus.floors} floor{trip.bus.floors > 1 ? "s" : ""} • {trip.bus.rows}×{trip.bus.cols}
                          </div>
                        </div>
                        <div>
                          <div className="text-secondary-text mb-1">Distance</div>
                          <div className="font-medium text-text">
                            {trip.route.distanceKm} km ({trip.route.estimatedMinutes} min)
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button 
                          variant="primary" 
                          fullWidth
                          onClick={() => router.push(`/trips/${trip.id}`)}
                        >
                          Continue to Seat Selection
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {results.totalPage > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(results.page - 1)}
            disabled={results.page === 1}
          >
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
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Button>

          {/* Page Numbers */}
          <div className="flex gap-1">
            {Array.from({ length: results.totalPage }, (_, i) => i + 1)
              .filter((page) => {
                // Show first, last, current, and adjacent pages
                return (
                  page === 1 ||
                  page === results.totalPage ||
                  Math.abs(page - results.page) <= 1
                );
              })
              .map((page, index, array) => {
                // Add ellipsis
                const showEllipsisBefore =
                  index > 0 && page - array[index - 1] > 1;

                return (
                  <div key={page} className="flex items-center">
                    {showEllipsisBefore && (
                      <span className="px-2 text-secondary-text">
                        ...
                      </span>
                    )}
                    <Button
                      variant={
                        page === results.page ? "accent" : "secondary"
                      }
                      size="sm"
                      onClick={() => onPageChange(page)}
                      className="min-w-10"
                    >
                      {page}
                    </Button>
                  </div>
                );
              })}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(results.page + 1)}
            disabled={results.page === results.totalPage}
          >
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
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
}
