"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTRPC } from "../../utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/button";
import useUser from "../../hooks/useUser";

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
    <div className="min-h-screen flex flex-col bg-background">
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
  const userQuery = useUser();
  const trpc = useTRPC();
  const pathname = usePathname();
  const logoutMutationOptions = trpc.users.postLogout.mutationOptions();
  const logoutMutation = useMutation({
    ...logoutMutationOptions,
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isLoggedIn = userQuery.isSuccess && userQuery.data;
  const navItems = [
    { href: "/", label: "Home", },
    { href: "/trips", label: "Trips", },
    { href: "/routes", label: "Routes", },
    { href: "/ticket", label: "View Ticket", },
    { href: "/about", label: "About", },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border dark:border-border bg-secondary">
      <div className="flex h-16 items-center px-6 justify-between">
        {/* Left: Logo */}
        <div className="flex-1">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-text dark:text-text hover:cursor-pointer">
              BusBus
            </span>
          </Link>
        </div>

        {/* Center: Nav */}
        <nav className="flex items-center space-x-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex-col text-text items-center space-x-3 px-4 py-3 rounded-lg transition-colors hover:bg-primary hover:text-accent ${
                    isActive && "underline"
                  }`}
                >
                  <span className={`${isActive && "font-bold"}`}>{item.label}</span>
                </Link>
              );
            })}
        </nav>

        {/* Right: Auth buttons */}
        <nav className="flex flex-1 items-center justify-end space-x-2">
          {isLoggedIn ? (
            <>
              <span className="text-sm font-medium text-secondary-text dark:text-secondary-text">
                Welcome, <span className="font-semibold text-text dark:text-text">{userQuery.data.name}</span>
              </span>
              <Button
                variant="primary"
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
                href="/users/login"
              >
                <Button
                  variant="primary"
                  size="sm">
                  Login
                </Button>
              </Link>
              <Link
                href="/users/register"
              >
                <Button
                  variant="accent"
                  size="sm">
                  Sign Up
                </Button>
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
    <nav className="w-64 border-r border-border dark:border-border bg-background dark:bg-background p-4">
      <div className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary dark:bg-primary text-accent dark:text-accent"
                  : "text-text dark:text-text hover:bg-secondary dark:hover:bg-secondary"
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
    <footer className="border-t border-border dark:border-border bg-secondary">
      <div className="px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
          <p className="text-sm text-secondary-text dark:text-secondary-text">
            © {new Date().getFullYear()} BusBus app. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link
              href="/privacy"
              className="text-sm text-secondary-text hover:text-text dark:text-secondary-text dark:hover:text-text transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-secondary-text hover:text-text dark:text-secondary-text dark:hover:text-text transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="text-sm text-secondary-text hover:text-text dark:text-secondary-text dark:hover:text-text transition-colors"
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
