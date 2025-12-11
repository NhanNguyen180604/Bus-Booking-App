"use client";

import { useParams } from "next/navigation";
import { AppShell } from "../../../components/layout/app-shell";
import { TripDetail } from "../../../components/trips/trip-detail";
import { useTRPC } from "../../../utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { RouterOutputsType } from "backend";
import { useState } from "react";

type Seat = RouterOutputsType["buses"]["getSeatsByBus"][number];

export default function TripDetailPage() {
  const params = useParams();
  const trpc = useTRPC();
  const tripId = params.id as string;
  const [selectedSeats, setSelectedSeat] = useState<Seat[]>([]);

  const tripQuery = useQuery({
    ...trpc.trips.findOneById.queryOptions({ id: tripId }),
    enabled: !!tripId,
  });

  // put it here to manage loading easier
  const getSeatsQueryOptions = trpc.buses.getSeatsByBus.queryOptions({ id: tripQuery.data?.bus?.id! });
  const getSeatsQuery = useQuery({
    ...getSeatsQueryOptions,
    enabled: !!tripQuery.data?.bus?.id,
  });

  const onSelectSeat = (seat: Seat) => {
    setSelectedSeat((prevSelectedSeats) => {
      const isSeatAlreadySelected = prevSelectedSeats.some(
        (s) => s.id === seat.id
      );
      if (isSeatAlreadySelected) {
        return prevSelectedSeats.filter((s) => s.id !== seat.id);
      }
      return [...prevSelectedSeats, seat];
    });
  }

  if (tripQuery.isLoading || getSeatsQuery.isLoading) {
    return (
      <AppShell hideNav>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </AppShell>
    );
  }

  if (tripQuery.isError || !tripQuery.data || !getSeatsQuery.data) {
    return (
      <AppShell hideNav>
        <div className="max-w-4xl mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text mb-4">
              {!getSeatsQuery.data ? `Seats Not Found.` : `Trip Not Found`}
            </h1>
            <p className="text-secondary-text mb-6">
              {!getSeatsQuery.data ? `Error loading seats for this trip, please try again later.` : `The trip you're looking for doesn't exist or has been removed.`}
            </p>
            <Link
              href="/"
              className="text-accent hover:underline"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell hideNav>
      <TripDetail
        trip={tripQuery.data}
        key={tripQuery.data.id}
        onSelectSeat={onSelectSeat}
        selectedSeats={selectedSeats}
        seatList={getSeatsQuery.data}
      />
    </AppShell>
  );
}
