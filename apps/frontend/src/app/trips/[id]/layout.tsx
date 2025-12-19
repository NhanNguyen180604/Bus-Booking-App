import { AppShell } from "@/src/components/layout/app-shell";

export default function TripDetailsLayoutPage({ children }: { children: React.ReactNode }) {
    return (
        <AppShell hideNav>
            {children}
        </AppShell>
    );
}