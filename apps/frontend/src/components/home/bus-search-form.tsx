"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { FormField } from "../ui/form-field";
import { Autocomplete } from "../ui/autocomplete";
import { useTRPC } from "../../utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { type TripFindManyDtoType } from "@repo/shared";

interface BusSearchFormProps {
  onSearch: (params: Omit<TripFindManyDtoType, 'page' | 'perPage'>) => void;
  isLoading: boolean;
}

const BusSearchFormSchema = z.object({
  origin: z.uuid().optional(),
  destination: z.uuid().optional(),
  departureTime: z.string().optional(),
}).refine(
  (data) => data.origin && data.destination,
  {
    message: "Both origin and destination are required",
  }
).refine(
  (data) => data.origin !== data.destination,
  {
    message: "Origin and destination must be different",
    path: ["destination"],
  }
);

type BusSearchFormType = {
  origin?: string;
  destination?: string;
  departureTime?: string;
};

export function BusSearchForm({ onSearch, isLoading }: BusSearchFormProps) {
  const trpc = useTRPC();
  const stationsQuery = useQuery(trpc.stations.findAll.queryOptions());

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    getValues,
    formState: { errors },
  } = useForm<BusSearchFormType>({
    resolver: zodResolver(BusSearchFormSchema),
  });

  const origin = watch("origin");
  const destination = watch("destination");

  const onSubmit = (data: BusSearchFormType) => {
    onSearch({
      origin: data.origin,
      destination: data.destination,
      departureTime: data.departureTime ? new Date(data.departureTime) : undefined,
    });
  };

  const handleSwap = () => {
    const currentOrigin = getValues("origin");
    const currentDestination = getValues("destination");
    setValue("origin", currentDestination, { shouldValidate: true });
    setValue("destination", currentOrigin, { shouldValidate: true });
  };

  const stations = stationsQuery.data || [];

  return (
    <Card className="w-full overflow-visible">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6">
        <div className="flex flex-col gap-4 overflow-visible">
          {/* Main search inputs */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Origin and Destination */}
            <div className="flex flex-3 gap-2 relative z-10">
              <div className="flex-1">
                <Controller
                  name="origin"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      label="Origin"
                      options={stations.map((station) => ({
                        id: station.id,
                        label: station.name,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select origin..."
                      disabled={stationsQuery.isLoading}
                      error={errors.origin?.message}
                    />
                  )}
                />
              </div>

              <button
                type="button"
                onClick={handleSwap}
                className="self-end mb-0 p-3 text-text hover:text-text dark:text-text dark:hover:text-text transition-colors"
                aria-label="Swap origin and destination"
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
                  className="rotate-90"
                >
                  <path d="M7 16V4M7 4L3 8M7 4l4 4" />
                  <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>

              <div className="flex-1">
                <Controller
                  name="destination"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      label="Destination"
                      options={stations.map((station) => ({
                        id: station.id,
                        label: station.name,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select destination..."
                      disabled={stationsQuery.isLoading}
                      error={errors.destination?.message}
                    />
                  )}
                />
              </div>
            </div>

            {/* Date */}
            <div className="flex-1 lg:max-w-xs">
              <FormField
                label="Date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                error={errors.departureTime?.message}
                {...register("departureTime")}
              />
            </div>

            {/* Passengers */}
            <div className="flex-1 lg:max-w-xs">
              <label className="block text-sm font-medium text-text dark:text-text mb-1">
                Passengers
              </label>
              <select
              //Change later
                disabled
                // {...register("passengers", { valueAsNumber: true })}
                className="w-full rounded-md border border-border dark:border-border bg-primary py-3 text-text dark:text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>
                    {num} passenger{num > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full lg:w-auto px-8"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
}
