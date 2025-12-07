"use client"
import { AppShell } from "@/src/components/layout/app-shell";

export default function BookingLookUpLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppShell hideFooter hideNav>
            {children}
        </AppShell>
    );
}