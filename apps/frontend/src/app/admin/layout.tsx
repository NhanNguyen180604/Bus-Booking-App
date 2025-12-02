"use client";
import AdminNavBar from "@/src/components/admin/navbar";
import { AppShell } from "@/src/components/layout/app-shell";
import Loading from "@/src/components/ui/loading";
import useUser from "@/src/hooks/useUser";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const userQuery = useUser();
    if (userQuery.isPending) {
        return <Loading />;
    }

    if (userQuery.isSuccess && userQuery.data.role !== "ADMIN" || userQuery.isError) {
        //TODO: real 401 page
        return <>401</>;
    }

    return (
        <AppShell hideFooter isAdmin nav={<AdminNavBar />}>
            {children}
        </AppShell>
    );
}