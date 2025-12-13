"use client"
import { AdminNavBar } from "@/src/components/layout/navbar";
import { AppShell } from "@/src/components/layout/app-shell";
import Loading from "@/src/components/ui/loading";
import useUser from "@/src/hooks/useUser";
import UnauthorizedPage from "@/src/components/status-pages/unauthorized-page";
import ForbiddenPage from "@/src/components/status-pages/forbidden-page";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const userQuery = useUser();
    if (userQuery.isPending) {
        return <Loading />;
    }

    if (userQuery.isSuccess && userQuery.data.role !== "ADMIN") {
        return (
            <ForbiddenPage routerGoBack />
        );
    }

    if (userQuery.isError) {
        return (
            <UnauthorizedPage routerGoBack />
        );
    }

    return (
        <AppShell hideFooter hideHeaderNav nav={<AdminNavBar />}>
            {children}
        </AppShell>
    );
}