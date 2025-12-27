"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams as useNextSearchParams } from "next/navigation";
import { AppShell } from "../components/layout/app-shell";
import { BusSearchForm } from "../components/home/bus-search-form";
import { HeroSection } from "../components/home/hero-section";
import { AuthActions } from "../components/home/auth-actions";
import { SearchResults } from "../components/home/search-results";
import { FilterSortPanel } from "../components/home/filter-sort-panel";
import { useTRPC } from "../utils/trpc";
import { useQuery, skipToken } from "@tanstack/react-query";
import { type TripFindManyDtoType } from "@repo/shared";
import { FilterIcon } from "../components/icons/filter-ic";

export default function Home() {
  const trpc = useTRPC();
  const router = useRouter();
  const nextSearchParams = useNextSearchParams();
  const [searchParams, setSearchParams] = useState<TripFindManyDtoType | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Restore state from URL on mount
  useEffect(() => {
    const origin = nextSearchParams.get('origin');
    const destination = nextSearchParams.get('destination');
    const departureTime = nextSearchParams.get('departureTime');
    const passengers = nextSearchParams.get('passengers');
    const busType = nextSearchParams.get('busType');
    const minPrice = nextSearchParams.get('minPrice');
    const maxPrice = nextSearchParams.get('maxPrice');
    const sortPrice = nextSearchParams.get('sortPrice');
    const sortDepartureTime = nextSearchParams.get('sortDepartureTime');
    const page = nextSearchParams.get('page');

    if (origin && destination) {
      const params: TripFindManyDtoType = {
        origin,
        destination,
        passengers: passengers ? parseInt(passengers) : 1,
        page: page ? parseInt(page) : 1,
        perPage: 10,
      };

      if (departureTime) params.departureTime = new Date(departureTime);
      if (passengers) params.passengers = parseInt(passengers);
      if (busType) params.busType = busType.split(',');
      if (minPrice) params.minPrice = parseInt(minPrice);
      if (maxPrice) params.maxPrice = parseInt(maxPrice);
      if (sortPrice) params.sortPrice = sortPrice as 'asc' | 'desc';
      if (sortDepartureTime) params.sortDepartureTime = sortDepartureTime as 'asc' | 'desc';

      setSearchParams(params);
    }
  }, []);

  // Update URL when search params change
  useEffect(() => {
    if (!searchParams) return;

    const params = new URLSearchParams();
    params.set('origin', searchParams.origin!);
    params.set('destination', searchParams.destination!);
    if (searchParams.departureTime) params.set('departureTime', searchParams.departureTime.toISOString());
    if (searchParams.passengers) params.set('passengers', searchParams.passengers.toString());
    if (searchParams.busType?.length) params.set('busType', searchParams.busType.join(','));
    if (searchParams.minPrice !== undefined) params.set('minPrice', searchParams.minPrice.toString());
    if (searchParams.maxPrice !== undefined) params.set('maxPrice', searchParams.maxPrice.toString());
    if (searchParams.sortPrice) params.set('sortPrice', searchParams.sortPrice);
    if (searchParams.sortDepartureTime) params.set('sortDepartureTime', searchParams.sortDepartureTime);
    if (searchParams.page) params.set('page', searchParams.page.toString());

    router.replace(`/?${params.toString()}`, { scroll: false });
  }, [searchParams]);

  const searchQuery = useQuery({
    ...trpc.trips.search.queryOptions(searchParams ?? skipToken),
    staleTime: 5 * 60 * 1000,
  });

  const perPage = 10;
  const handleSearch = (params: Omit<TripFindManyDtoType, 'page' | 'perPage'>) => {
    setSearchParams({ ...params, page: 1, perPage });
  };

  const handlePageChange = (page: number) => {
    if (searchParams) {
      setSearchParams({ ...searchParams, page, perPage });
    }
  };

  const handleFilterChange = (filters: {
    options: Omit<TripFindManyDtoType, 'page' | 'perPage'>;
  }) => {
    setSearchParams({
      ...searchParams,
      ...filters.options, page: 1, perPage
    });
  };

  const handleResetFilters = () => {
    if (searchParams) {
      setSearchParams({
        origin: searchParams.origin,
        destination: searchParams.destination,
        departureTime: searchParams.departureTime,
        passengers: searchParams.passengers,
        page: 1,
        perPage,
      });
    }
  };

  return (
    <AppShell hideNav>
      <div className="max-w-7xl mx-auto py-8 space-y-8">
        <HeroSection />
        <BusSearchForm
          onSearch={handleSearch}
          isLoading={searchQuery.isFetching}
          initialValues={searchParams}
        />
        {searchParams && (
          <>
            {/* Mobile overlay backdrop for filter panel */}
            {isFilterOpen && (
              <div
                className="fixed inset-0 m-0 bg-black/40 z-40 md:hidden"
                onClick={() => setIsFilterOpen(false)}
                aria-hidden="true"
              />
            )}

            <div className="flex gap-6 relative">
              {/* Filter Panel - Mobile: Fixed overlay, Desktop: Sidebar */}
              {/* bad code bad code */}
              <div
                className={`
                  fixed lg:relative inset-y-0 left-0 w-80 bg-background
                  transform transition-transform duration-300 lg:transform-none
                  ${isFilterOpen ? "translate-x-0 z-50" : "-translate-x-full lg:translate-x-0"}
                  lg:w-80 lg:shrink-0
                  top-16 lg:top-auto h-[calc(100vh-4rem)] lg:h-auto
                  overflow-y-auto lg:overflow-visible
                `}
              >
                <FilterSortPanel
                  options={searchParams}
                  onFilterChange={handleFilterChange}
                  onReset={handleResetFilters}
                />
              </div>

              <div className="flex-1 min-w-0">
                <SearchResults
                  results={
                    searchQuery.data ? searchQuery.data : null
                  }
                  isLoading={searchQuery.isFetching}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>

            {/* Mobile Floating Action Button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="sticky bottom-20 right-6 z-40 md:hidden w-14 h-14 rounded-full bg-primary text-accent shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center float-right"
              aria-label="Toggle filter panel"
            >
              <FilterIcon />
            </button>
          </>
        )}
        <AuthActions />
      </div>
    </AppShell>
  );
}
