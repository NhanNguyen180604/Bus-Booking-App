"use client";

import { Card, CardBody } from "../ui/card";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import { TripFindManyDtoType } from "@repo/shared";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/src/utils/trpc";
import Checkbox from "../ui/checkbox";

type FilterSortOptionsType = Omit<TripFindManyDtoType, 'page' | 'perPage'>;

interface FilterSortPanelProps {
  options: FilterSortOptionsType;
  onFilterChange: (filters: {
    options: FilterSortOptionsType;
  }) => void;
  onReset: () => void;
}

export function FilterSortPanel({
  options,
  onFilterChange,
  onReset,
}: FilterSortPanelProps) {
  const PRICE_MIN = 0;
  const PRICE_MAX = 2000000;

  const [localBusTypes, setLocalBusTypes] = useState<string[]>(options.busType || []);
  const [localMinPrice, setLocalMinPrice] = useState<number>(options.minPrice || 0);
  const [localMaxPrice, setLocalMaxPrice] = useState<number>(options.maxPrice || PRICE_MAX);
  const [localSortPrice, setLocalSortPrice] = useState<"asc" | "desc" | undefined>(options.sortPrice);
  const [localSortDepartureTime, setLocalSortDepartureTime] = useState<"asc" | "desc" | undefined>(options.sortDepartureTime);

  useEffect(() => {
    setLocalBusTypes(options.busType || []);
    setLocalMinPrice(options.minPrice || 0);
    setLocalMaxPrice(options.maxPrice || PRICE_MAX);
    setLocalSortPrice(options.sortPrice);
    setLocalSortDepartureTime(options.sortDepartureTime);
  }, [options]);

  const handleBusTypeToggle = (busTypeId: string) => {
    const newBusTypes = localBusTypes.includes(busTypeId)
      ? localBusTypes.filter((id) => id !== busTypeId)
      : [...localBusTypes, busTypeId];
    setLocalBusTypes(newBusTypes);
  };

  const handleDepartureTimeSort = () => {
    if (localSortDepartureTime === undefined) {
      setLocalSortDepartureTime("asc");
      setLocalSortPrice(undefined);
    } else if (localSortDepartureTime === "asc") {
      setLocalSortDepartureTime("desc");
      setLocalSortPrice(undefined);
    } else {
      setLocalSortDepartureTime(undefined);
    }
  };

  const handlePriceSort = () => {
    if (localSortPrice === undefined) {
      setLocalSortPrice("asc");
      setLocalSortDepartureTime(undefined);
    } else if (localSortPrice === "asc") {
      setLocalSortPrice("desc");
      setLocalSortDepartureTime(undefined);
    } else {
      setLocalSortPrice(undefined);
    }
  };

  const handleApply = () => {
    onFilterChange({
      options: {
        busType: localBusTypes,
        minPrice: localMinPrice,
        maxPrice: localMaxPrice,
        sortPrice: localSortPrice,
        sortDepartureTime: localSortDepartureTime,
      }
    });
  };

  const handleReset = () => {
    setLocalBusTypes([]);
    setLocalMinPrice(0);
    setLocalMaxPrice(PRICE_MAX);
    setLocalSortPrice(undefined);
    setLocalSortDepartureTime(undefined);
    onReset();
  };

  const hasActiveFilters =
    localBusTypes.length > 0 ||
    localMinPrice > 0 ||
    localMaxPrice < PRICE_MAX ||
    localSortPrice !== undefined ||
    localSortDepartureTime !== undefined;


  const trpc = useTRPC();
  const busTypesQuery = useQuery(
    trpc.busTypes.search.queryOptions({
      page: 1,
      perPage: 100,
    })
  );

  return (
    <Card className="w-full h-fit sticky top-4">
      <CardBody padding="md">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text">Filters & Sort</h3>
            <Button
              variant="danger"
              size="sm"
              disabled={!hasActiveFilters}
              className={`${!hasActiveFilters ? `opacity-0!` : `opacity-100`} transition-opacity`}
              onClick={handleReset}
            >
              Reset
            </Button>
          </div>

          {/* Bus Type Filter */}
          <div>
            <h4 className="text-sm font-medium text-text mb-3">Bus Type</h4>
            <div className="space-y-2">
              {busTypesQuery.data?.data.map((busType) => (
                <Checkbox
                  id={busType.id}
                  key={busType.id}
                  title={busType.name}
                  checked={localBusTypes.includes(busType.id)}
                  onChange={() => handleBusTypeToggle(busType.id)
                  }
                >
                </Checkbox>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-text">Price Range</h4>
            </div>
            <div className="px-1">
              <div className="relative h-12 flex items-center">
                {/* Track */}
                <div className="absolute w-full h-2 bg-primary rounded-lg">
                  <div
                    className="absolute h-2 bg-accent rounded-lg"
                    style={{
                      left: `${(localMinPrice / PRICE_MAX) * 100}%`,
                      right: `${100 - (localMaxPrice / PRICE_MAX) * 100}%`,
                    }}
                  />
                </div>
                {/* Min Slider */}
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  value={localMinPrice}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value <= localMaxPrice - 10) {
                      setLocalMinPrice(value);
                    }
                  }}
                  className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary"
                  style={{ zIndex: localMinPrice > PRICE_MAX - 100 ? 5 : 3 }}
                />
                {/* Max Slider */}
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  value={localMaxPrice}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= localMinPrice + 10) {
                      setLocalMaxPrice(value);
                    }
                  }}
                  className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary"
                  style={{ zIndex: 4 }}
                />
              </div>
              <div className="flex justify-between text-xs text-secondary-text items-center">
                <span>VND {PRICE_MIN}</span>
                <span className="text-sm text-text font-semibold">VND {localMinPrice} - {localMaxPrice}</span>
                <span>VND {PRICE_MAX}</span>
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <h4 className="text-sm font-medium text-text mb-3">Sort By</h4>
            <div className="space-y-3 flex gap-6">
              {/* Sort by Departure Time */}
              <div>
                <label className="text-sm text-text mb-2 block">Departure Time</label>
                <Button
                  variant={localSortDepartureTime !== undefined ? "accent" : "secondary"}
                  size="sm"
                  onClick={handleDepartureTimeSort}
                >
                  {localSortDepartureTime === "asc" ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1"
                      >
                        <path d="m3 8 4-4 4 4" />
                        <path d="M7 4v16" />
                        <path d="M11 12h10" />
                        <path d="M11 16h7" />
                        <path d="M11 20h4" />
                      </svg>
                      Earliest First
                    </>
                  ) : localSortDepartureTime === "desc" ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1"
                      >
                        <path d="m3 16 4 4 4-4" />
                        <path d="M7 20V4" />
                        <path d="M11 4h10" />
                        <path d="M11 8h7" />
                        <path d="M11 12h4" />
                      </svg>
                      Latest First
                    </>
                  ) : (
                    "No sort"
                  )}
                </Button>
              </div>

              {/* Sort by Price */}
              <div>
                <label className="text-sm text-text mb-2 block">Price</label>
                <Button
                  variant={localSortPrice !== undefined ? "accent" : "secondary"}
                  size="sm"
                  onClick={handlePriceSort}
                >
                  {localSortPrice === "asc" ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1"
                      >
                        <path d="m3 8 4-4 4 4" />
                        <path d="M7 4v16" />
                        <path d="M11 12h10" />
                        <path d="M11 16h7" />
                        <path d="M11 20h4" />
                      </svg>
                      Low to High
                    </>
                  ) : localSortPrice === "desc" ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1"
                      >
                        <path d="m3 16 4 4 4-4" />
                        <path d="M7 20V4" />
                        <path d="M11 4h10" />
                        <path d="M11 8h7" />
                        <path d="M11 12h4" />
                      </svg>
                      High to Low
                    </>
                  ) : (
                    "No sort"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <Button
            variant="accent"
            fullWidth
            onClick={handleApply}
            disabled={!hasActiveFilters}
            className="transition"
          >
            Apply Filters
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
