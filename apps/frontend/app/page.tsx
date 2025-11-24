"use client";

import { AppShell } from "../components/layout/app-shell";
import { BusSearchForm } from "../components/home/bus-search-form";
import { HeroSection } from "../components/home/hero-section";
import { AuthActions } from "../components/home/auth-actions";
import { useTRPC } from "../utils/trpc";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const trpc = useTRPC();

  const userQueryOptions = trpc.users.getMe.queryOptions();
  const userQuery = useQuery({
    ...userQueryOptions,
    retry: false,
  });

  const isLoggedIn = userQuery.isSuccess && userQuery.data;

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
