"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { FormField } from "../ui/form-field";

const busSearchSchema = z.object({
  origin: z.string().min(1, { message: "Please enter an origin" }),
  destination: z.string().min(1, { message: "Please enter a destination" }),
  date: z.string().min(1, { message: "Please select a date" }),
  returnDate: z.string().optional(),
  passengers: z.number().min(1).max(10),
});

type BusSearchFormData = z.infer<typeof busSearchSchema>;

export function BusSearchForm() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BusSearchFormData>({
    resolver: zodResolver(busSearchSchema),
    defaultValues: {
      origin: "",
      destination: "",
      date: "",
      returnDate: "",
      passengers: 1,
    },
  });

  const origin = watch("origin");
  const destination = watch("destination");

  const onSubmit = (data: BusSearchFormData) => {
    console.log(data);
  };

  const handleSwap = () => {
    const temp = origin;
    setValue("origin", destination);
    setValue("destination", temp);
  };

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6">
        <div className="flex flex-col gap-4">
          {/* Main search inputs */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Origin and Destination */}
            <div className="flex flex-3 gap-2">
              <div className="flex-1">
                <FormField
                  label="Origin"
                  type="text"
                  placeholder="Leaving from..."
                  error={errors.origin?.message}
                  {...register("origin")}
                />
              </div>

              <button
                type="button"
                onClick={handleSwap}
                className="self-end mb-0 p-3 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
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
                <FormField
                  label="Destination"
                  type="text"
                  placeholder="Going to..."
                  error={errors.destination?.message}
                  {...register("destination")}
                />
              </div>
            </div>

            {/* Date */}
            <div className="flex-1 lg:max-w-xs">
              <FormField
                label="Date"
                type="date"
                error={errors.date?.message}
                {...register("date")}
              />
            </div>

            {/* Return Date */}
            <div className="flex-1 lg:max-w-xs">
              <FormField
                label="Return Date"
                type="date"
                error={errors.returnDate?.message}
                {...register("returnDate")}
              />
            </div>

            {/* Passengers */}
            <div className="flex-1 lg:max-w-xs">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Passengers
              </label>
              <select
              //Change later
                disabled
                {...register("passengers", { valueAsNumber: true })}
                className="w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 py-3 text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                disabled
                type="submit"
                variant="primary"
                size="lg"
                className="w-full lg:w-auto px-8"
              >
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
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
}
