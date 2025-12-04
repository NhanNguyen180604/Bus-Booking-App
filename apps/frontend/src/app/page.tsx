"use client";

import { useState } from "react";
import { AppShell } from "../components/layout/app-shell";
import { BusSearchForm } from "../components/home/bus-search-form";
import { HeroSection } from "../components/home/hero-section";
import { AuthActions } from "../components/home/auth-actions";
import { SearchResults } from "../components/home/search-results";
import { useTRPC } from "../utils/trpc";
import { useQuery, skipToken } from "@tanstack/react-query";
import { type TripFindManyDtoType } from "@repo/shared";

export default function Home() {
  const trpc = useTRPC();
  const [searchParams, setSearchParams] = useState<TripFindManyDtoType | null>(null);

  const searchQuery = useQuery(
    trpc.trips.search.queryOptions(searchParams ?? skipToken)
  );

  const handleSearch = (params: Omit<TripFindManyDtoType, 'page' | 'perPage'>) => {
    setSearchParams({ ...params, page: 1, perPage: 10 });
  };

  const handlePageChange = (page: number) => {
    if (searchParams) {
      setSearchParams({ ...searchParams, page });
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
          <SearchResults
            results={
              searchQuery.data ? searchQuery.data : null
            }
            isLoading={searchQuery.isFetching}
            onPageChange={handlePageChange}
          />
        )}
        <AuthActions />
      </div>
    </AppShell>
  );
}
