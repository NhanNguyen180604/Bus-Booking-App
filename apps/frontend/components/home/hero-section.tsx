'use client';
import useUser from "apps/frontend/hooks/useUser";

export function HeroSection() {
  const { data, isLoading } = useUser();
  return (
    <div className="text-center mb-8">
      <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
        BusBus
      </h1>
      {(!isLoading && data) ? (
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Welcome back,{" "}
          <span className="font-semibold text-zinc-900 dark:text-white">
            {data.name}
          </span>
          ! Find your next trip below.
        </p>
      ) : (
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Search and book bus tickets for your next journey
        </p>
      )}
    </div>
  );
}
