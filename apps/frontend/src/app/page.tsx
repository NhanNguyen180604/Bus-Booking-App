"use client";

import { useState } from "react";
import { AppShell } from "../components/layout/app-shell";
import { BusSearchForm } from "../components/home/bus-search-form";
import { HeroSection } from "../components/home/hero-section";
import { AuthActions } from "../components/home/auth-actions";
import { SearchResults } from "../components/home/search-results";
import { FilterSortPanel } from "../components/home/filter-sort-panel";
import { useTRPC } from "../utils/trpc";
import { useQuery, skipToken } from "@tanstack/react-query";
import { type TripFindManyDtoType } from "@repo/shared";

export default function Home() {
  const trpc = useTRPC();
  const [searchParams, setSearchParams] = useState<TripFindManyDtoType | null>(null);

  const searchQuery = useQuery(
    trpc.trips.search.queryOptions(searchParams ?? skipToken)
  );

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
    setSearchParams({ ...searchParams, 
      ...filters.options, page: 1, perPage });
  };

  const handleResetFilters = () => {
    if (searchParams) {
      setSearchParams({
        origin: searchParams.origin,
        destination: searchParams.destination,
        departureTime: searchParams.departureTime,
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
        />
        {searchParams && (
          <div className="flex gap-6">
            <div className="w-80 shrink-0">
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
        )}
        <AuthActions />
      </div>
    </AppShell>
  );
}
