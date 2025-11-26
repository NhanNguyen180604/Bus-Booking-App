'use client';
import useUser from "../../hooks/useUser";

export function HeroSection() {
  const { data, isLoading } = useUser();
  return (
    <div className="text-center mb-8">
      <h1 className="text-5xl font-bold tracking-tight text-text dark:text-text mb-4">
        BusBus
      </h1>
      {(!isLoading && data) && (
        <p className="text-lg text-secondary-text dark:text-secondary-text">
          Welcome back,{" "}
          <span className="font-semibold text-text dark:text-text">
            {data.name}
          </span>
        </p>
      )}
      <p className="text-lg text-secondary-text dark:text-secondary-text">
          BusBus bus, bus everywhere!
      </p>
    </div>
  );
}
