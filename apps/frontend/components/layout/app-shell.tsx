"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTRPC } from "../../utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "../ui/button";

export interface AppShellProps {
  children: ReactNode;
  header?: ReactNode;
  nav?: ReactNode;
  footer?: ReactNode;
  hideHeader?: boolean;
  hideNav?: boolean;
  hideFooter?: boolean;
}

export function AppShell({
  children,
  header,
  nav,
  footer,
  hideHeader = false,
  hideNav = false,
  hideFooter = false,
}: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-900">
      {!hideHeader && (header || <DefaultHeader />)}
      <div className="flex flex-1">
        {!hideNav && (nav || <DefaultNav />)}
        <main className="flex-1 p-6">{children}</main>
      </div>
      {!hideFooter && (footer || <DefaultFooter />)}
    </div>
  );
}

function DefaultHeader() {
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
      router.push("/");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isLoggedIn = userQuery.isSuccess && userQuery.data;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="flex h-16 items-center px-6">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-zinc-900 dark:text-white">
            BusBus
          </span>
        </Link>
        <nav className="ml-auto flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Welcome, <span className="font-semibold text-zinc-900 dark:text-white">{userQuery.data.name}</span>
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function DefaultNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/bookings", label: "Bookings", icon: "🎫" },
    { href: "/routes", label: "Routes", icon: "🗺️" },
    { href: "/profile", label: "Profile", icon: "👤" },
  ];

  return (
    <nav className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <div className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function DefaultFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            © {new Date().getFullYear()} Bus Booking App. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link
              href="/privacy"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Export sub-components for custom use
export const Header = DefaultHeader;
export const Nav = DefaultNav;
export const Footer = DefaultFooter;
