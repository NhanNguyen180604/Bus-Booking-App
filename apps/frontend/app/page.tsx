"use client";

import Link from "next/link";
import { Button } from "../components/ui/button";
import { useTRPC } from "../utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const trpc = useTRPC();

  const userQueryOptions = trpc.users.getMe.queryOptions();
  const userQuery = useQuery({
    ...userQueryOptions,
    retry: false,
  });

  const logoutMutationOptions = trpc.users.postLogout.mutationOptions();
  const logoutMutation = useMutation({
    ...logoutMutationOptions,
    onSuccess: () => {
      userQuery.refetch();
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isLoggedIn = userQuery.isSuccess && userQuery.data;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <main className="flex flex-col items-center gap-8 px-8 py-16 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Bus Booking App
        </h1>

        {isLoggedIn ? (
          <>
            <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
              Welcome, <span className="font-semibold text-zinc-900 dark:text-white">{userQuery.data.name}</span>! Ready to book your next trip?
            </p>
            <div className="flex gap-4">
              <Button variant="primary" size="lg">
                Book a Trip
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
              Welcome to the Bus Booking App. Sign in to book your next trip or create an account to get started.
            </p>
            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="primary" size="lg">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary" size="lg">
                  Create Account
                </Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
