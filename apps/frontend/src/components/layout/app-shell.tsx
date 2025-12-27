"use client"

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTRPC } from "../../utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { Button } from "../ui/button";
import useUser from "../../hooks/useUser";
import { UserRoleEnum } from "@repo/shared";

export interface AppShellProps {
  children: ReactNode;
  header?: ReactNode;
  nav?: ReactNode;
  footer?: ReactNode;
  hideHeader?: boolean;
  hideNav?: boolean;
  hideFooter?: boolean;
  hideHeaderNav?: boolean;
}

export function AppShell({
  children,
  header,
  nav,
  footer,
  hideHeader = false,
  hideNav = false,
  hideFooter = false,
  hideHeaderNav = false,
}: AppShellProps) {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* re-use the state for admin/driver nav and customer nav, very spaghetti */}
      {!hideHeader && (header || <DefaultHeader hideHeaderNav={hideHeaderNav} onToggleNav={() => setIsNavOpen((v) => !v)} isCollapsed={!isNavOpen} />)}

      {/* Admin nav responsive */}
      {/* Overlay + slide-in nav for <xl screens */}
      {!hideNav && (
        <>
          <div
            className={`fixed inset-0 bg-black/40 z-40 xl:hidden transition-opacity ${isNavOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
            onClick={() => setIsNavOpen(false)}
            aria-hidden={!isNavOpen}
          />
          <div
            className={`fixed inset-y-0 left-0 z-50 xl:hidden transform transition-transform duration-300 ${isNavOpen ? "translate-x-0" : "-translate-x-full"}`}
            role="dialog"
            aria-modal="true"
          >
            {/* Sidebar content */}
            <div className="w-80 h-full border-r border-border bg-background">
              <div className="h-16 xl:hidden bg-secondary dark:bg-secondary border-b border-border flex items-center px-6">
                <Link href="/" className="py-4">
                  <span className="text-xl font-bold text-text dark:text-text hover:cursor-pointer hover:text-accent dark:hover:text-accent transition-colors">
                    BusBus
                  </span>
                </Link>
              </div>
              <div className="p-4">
                {nav || <DefaultNav />}
              </div>
            </div>
          </div>
        </>
      )}

      {/* very spaghetti */}
      <div className="flex flex-1 p-4">
        {!hideNav && (
          <div className="hidden xl:block">
            {nav || <DefaultNav />}
          </div>
        )}
        <main className="flex-1 lg:px-16">{children}</main>
      </div>
      {!hideFooter && (footer || <DefaultFooter />)}
    </div>
  );
}

export interface DefaultHeaderProps {
  hideHeaderNav?: boolean;
  isCollapsed?: boolean;
  onToggleNav?: () => void;
}

function DefaultHeader({ hideHeaderNav = false, isCollapsed, onToggleNav }: DefaultHeaderProps) {
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

  const pathName = usePathname();
  const isCustomerPage = !pathName.startsWith('/admin') && !pathName.startsWith('/driver');

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isLoggedIn = userQuery.isSuccess && userQuery.data;
  const isAdmin = isLoggedIn && userQuery.data.role === UserRoleEnum.ADMIN;
  const isDriver = isLoggedIn && userQuery.data.role === UserRoleEnum.DRIVER;

  const navItems = [
    { href: "/", label: "Home", },
    // { href: "/trips", label: "Trips", },
    // { href: "/routes", label: "Routes", },
    { href: "/ticket", label: "View Ticket", },
    // { href: "/about", label: "About", },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border dark:border-border bg-secondary">
      <div className="flex h-16 items-center px-3 sm:px-6 justify-between gap-2">
        {/* Left: Logo */}
        <div className="flex gap-2 sm:gap-4 items-center">
          {/* Mobile: Hamburger toggle (<xl) */}
          <button
            type="button"
            onClick={onToggleNav}
            className={`
              ${isCustomerPage && 'lg:hidden'}
              xl:hidden inline-flex items-center justify-center 
              rounded-md p-2 text-text 
              hover:bg-primary hover:text-accent focus:outline-none focus:ring-2 focus:ring-primary
            `}
            aria-label="Toggle navigation"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <Link href="/" className="py-4">
            <span className="text-lg sm:text-xl font-bold text-text dark:text-text hover:cursor-pointer hover:text-accent dark:hover:text-accent transition-colors">
              BusBus
            </span>
          </Link>
          {isAdmin && (
            <Link href='/admin/'
              className="hidden sm:block text-accent dark:text-accent w-fit h-fit px-3 sm:px-4 py-2 rounded-md hover:underline transition-colors font-bold text-sm sm:text-base"
            >
              Admin
            </Link>
          )}
          {isDriver && (
            <Link href='/driver/'
              className="hidden sm:block text-accent dark:text-accent w-fit h-fit px-3 sm:px-4 py-2 rounded-md hover:underline transition-colors font-bold text-sm sm:text-base"
            >
              Driver
            </Link>
          )}
        </div>

        {/* Center: Nav - Hidden on mobile and tablet */}
        {!hideHeaderNav && (
          <nav className="hidden lg:flex items-center space-x-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex-col items-center space-x-3 px-4 py-3 rounded-lg transition-colors hover:bg-primary hover:text-accent 
                    ${isActive ? "underline font-bold text-accent dark:text-accent" : "text-text dark:text-text"}
                  `}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {!hideHeaderNav && !isCollapsed && isCustomerPage && (
          <nav className="absolute left-0 right-0 top-16 bg-secondary border-b border-border shadow-lg z-40 lg:hidden">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-lg transition-colors text-sm hover:bg-primary hover:text-accent 
                      ${isActive ? "font-bold bg-primary/50 text-accent" : "text-text"}
                    `}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}

        {/* Right: Auth buttons */}
        <nav className="flex items-center justify-end space-x-1 sm:space-x-2">
          {userQuery.isPending ? (
            <span className="text-xs sm:text-sm font-medium text-secondary-text dark:text-secondary-text">Loading...</span>
          ) : (
            <>
              {isLoggedIn ? (
                <>
                  <div className="flex gap-x-1 sm:gap-x-2 items-center">
                    <span className="hidden md:block text-sm font-medium text-secondary-text dark:text-secondary-text">
                      Welcome, <span className="font-semibold text-text dark:text-text">{userQuery.data.name}</span>
                    </span>
                    <Link href='/users/profile'>
                      <img
                        loading="lazy"
                        className="rounded-full object-cover w-[32px] h-[32px] sm:w-[36px] sm:h-[36px]"
                        src={userQuery.data?.avatarUrl ?? 'https://placehold.co/36x36'}
                        alt="Avatar" />
                    </Link>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="text-xs sm:text-sm px-2 sm:px-3"
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
                      size="sm"
                      className="text-xs sm:text-sm px-2 sm:px-3">
                      Login
                    </Button>
                  </Link>
                  <Link
                    href="/users/register"
                  >
                    <Button
                      variant="accent"
                      size="sm"
                      className="text-xs sm:text-sm px-2 sm:px-3">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
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
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
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
