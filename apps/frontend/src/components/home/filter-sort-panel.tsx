"use client";

import { Card, CardBody } from "../ui/card";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import { type RouterOutputsType } from "backend";

type BusType = RouterOutputsType["busTypes"]["find"]["data"][number];

interface FilterSortPanelProps {
  busTypes: BusType[];
  selectedBusTypes: string[];
  minPrice?: number;
  maxPrice?: number;
  sortPrice?: "ASC" | "DESC";
  sortDepartureTime?: "ASC" | "DESC";
  onFilterChange: (filters: {
    busTypes: string[];
    minPrice?: number;
    maxPrice?: number;
    sortPrice?: "ASC" | "DESC";
    sortDepartureTime?: "ASC" | "DESC";
  }) => void;
  onReset: () => void;
}

export function FilterSortPanel({
  busTypes,
  selectedBusTypes,
  minPrice,
  maxPrice,
  sortPrice,
  sortDepartureTime,
  onFilterChange,
  onReset,
}: FilterSortPanelProps) {
  const [localBusTypes, setLocalBusTypes] = useState<string[]>(selectedBusTypes);
  const [localMinPrice, setLocalMinPrice] = useState<number>(minPrice || 0);
  const [localMaxPrice, setLocalMaxPrice] = useState<number>(maxPrice || 500);
  const [localSortPrice, setLocalSortPrice] = useState<"ASC" | "DESC" | undefined>(sortPrice);
  const [localSortDepartureTime, setLocalSortDepartureTime] = useState<"ASC" | "DESC" | undefined>(sortDepartureTime);

  const PRICE_MIN = 0;
  const PRICE_MAX = 500;

  useEffect(() => {
    setLocalBusTypes(selectedBusTypes);
    setLocalMinPrice(minPrice || 0);
    setLocalMaxPrice(maxPrice || 500);
    setLocalSortPrice(sortPrice);
    setLocalSortDepartureTime(sortDepartureTime);
  }, [selectedBusTypes, minPrice, maxPrice, sortPrice, sortDepartureTime]);

  const handleBusTypeToggle = (busTypeId: string) => {
    const newBusTypes = localBusTypes.includes(busTypeId)
      ? localBusTypes.filter((id) => id !== busTypeId)
      : [...localBusTypes, busTypeId];
    setLocalBusTypes(newBusTypes);
  };

  const handleApply = () => {
    onFilterChange({
      busTypes: localBusTypes,
      minPrice: localMinPrice > 0 ? localMinPrice : undefined,
      maxPrice: localMaxPrice < PRICE_MAX ? localMaxPrice : undefined,
      sortPrice: localSortPrice,
      sortDepartureTime: localSortDepartureTime,
    });
  };

  const handleReset = () => {
    setLocalBusTypes([]);
    setLocalMinPrice(0);
    setLocalMaxPrice(500);
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

  return (
    <Card className="w-full h-fit sticky top-4">
      <CardBody padding="md">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text">Filters & Sort</h3>
            {hasActiveFilters && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleReset}
              >
                Reset
              </Button>
            )}
          </div>

          {/* Bus Type Filter */}
          <div>
            <h4 className="text-sm font-medium text-text mb-3">Bus Type</h4>
            <div className="space-y-2">
              {busTypes.map((busType) => (
                <label
                  key={busType.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-secondary-hover p-2 rounded-md transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={localBusTypes.includes(busType.id)}
                    onChange={() => handleBusTypeToggle(busType.id)}
                    className="w-4 h-4 rounded border-border text-accent"
                  />
                  <span className="text-sm text-text">{busType.name}</span>
                </label>
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
                <span>${PRICE_MIN}</span>
                <span className="text-sm text-text font-semibold">${localMinPrice} - ${localMaxPrice}</span>
                <span>${PRICE_MAX}</span>
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <h4 className="text-sm font-medium text-text mb-3">Sort By</h4>
            <div className="space-y-3">
              {/* Sort by Departure Time */}
              <div>
                <label className="text-xs text-secondary-text mb-2 block">Departure Time</label>
                <div className="flex gap-2">
                  <Button
                    variant={localSortDepartureTime === "ASC" ? "accent" : "secondary"}
                    size="sm"
                    fullWidth
                    onClick={() => setLocalSortDepartureTime(localSortDepartureTime === "ASC" ? undefined : "ASC")}
                  >
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
                    Earliest
                  </Button>
                  <Button
                    variant={localSortDepartureTime === "DESC" ? "accent" : "secondary"}
                    size="sm"
                    fullWidth
                    onClick={() => setLocalSortDepartureTime(localSortDepartureTime === "DESC" ? undefined : "DESC")}
                  >
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
                    Latest
                  </Button>
                </div>
              </div>

              {/* Sort by Price */}
              <div>
                <label className="text-xs text-secondary-text mb-2 block">Price</label>
                <div className="flex gap-2">
                  <Button
                    variant={localSortPrice === "ASC" ? "accent" : "secondary"}
                    size="sm"
                    fullWidth
                    onClick={() => setLocalSortPrice(localSortPrice === "ASC" ? undefined : "ASC")}
                  >
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
                  </Button>
                  <Button
                    variant={localSortPrice === "DESC" ? "accent" : "secondary"}
                    size="sm"
                    fullWidth
                    onClick={() => setLocalSortPrice(localSortPrice === "DESC" ? undefined : "DESC")}
                  >
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
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <Button
            variant="accent"
            fullWidth
            onClick={handleApply}
            disabled={!hasActiveFilters}
          >
            Apply Filters
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
