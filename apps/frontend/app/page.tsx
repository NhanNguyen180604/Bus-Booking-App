"use client";

import { AppShell } from "../components/layout/app-shell";
import { BusSearchForm } from "../components/home/bus-search-form";
import { HeroSection } from "../components/home/hero-section";
import { AuthActions } from "../components/home/auth-actions";
import { useTRPC } from "../utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Loading from "../components/ui/loading";

export default function Home() {
  const trpc = useTRPC();

  const userQueryOptions = trpc.users.getMe.queryOptions();
  const userQuery = useQuery({
    ...userQueryOptions,
    retry: false,
    staleTime: 0, // Don't use stale data
    refetchOnMount: true, // Always refetch on mount
  });

  const isLoggedIn = userQuery.isSuccess && userQuery.data;
  const isLoading = userQuery.isLoading || userQuery.isFetching;

  if (isLoading) {
    return (
      <AppShell hideNav>
        <Loading />
      </AppShell>
    );
  }

  return (
    <AppShell hideNav>
      <div className="max-w-7xl mx-auto py-8 space-y-8">
        <HeroSection
          isLoggedIn={!!isLoggedIn}
          userName={userQuery.data?.name}
        />

        <BusSearchForm />

        {!isLoggedIn && <AuthActions />}
      </div>
    </AppShell>
  );
}
