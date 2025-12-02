"use client";

import { useParams, useRouter } from "next/navigation";
import { AppShell } from "../../../components/layout/app-shell";
import { TripDetail } from "../../../components/trips/trip-detail";
import { useTRPC } from "../../../utils/trpc";
import { useQuery } from "@tanstack/react-query";

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const trpc = useTRPC();
  const tripId = params.id as string;

  const tripQuery = useQuery({
    ...trpc.trips.findOneById.queryOptions({ id: tripId }),
    enabled: !!tripId,
  });

  if (tripQuery.isLoading) {
    return (
      <AppShell hideNav>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </AppShell>
    );
  }

  if (tripQuery.isError || !tripQuery.data) {
    return (
      <AppShell hideNav>
        <div className="max-w-4xl mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text mb-4">Trip Not Found</h1>
            <p className="text-secondary-text mb-6">
              The trip you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.push("/")}
              className="text-accent hover:underline"
            >
              Return to Home
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell hideNav>
      <TripDetail 
        trip={{
          ...tripQuery.data,
          departureTime: new Date(tripQuery.data.departureTime),
          arrivalTime: new Date(tripQuery.data.arrivalTime),
        }} 
      />
    </AppShell>
  );
}
