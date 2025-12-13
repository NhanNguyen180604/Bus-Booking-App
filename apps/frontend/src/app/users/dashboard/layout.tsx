"use client"
import { UserNavBar } from "@/src/components/layout/navbar";
import { AppShell } from "@/src/components/layout/app-shell";
import Loading from "@/src/components/ui/loading";
import useUser from "@/src/hooks/useUser";
import UnauthorizedPage from "@/src/components/status-pages/unauthorized-page";

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
    const userQuery = useUser();
    if (userQuery.isPending) {
        return <Loading />;
    }

    if (userQuery.isSuccess && userQuery.data.role !== "USER" || userQuery.isError) {
        //TODO: real 401 page
        console.log(userQuery.data?.role);
        return (
            <AppShell hideNav>
                <UnauthorizedPage routerGoBack />
            </AppShell>
        )
    }

    return (
        <AppShell hideFooter hideHeaderNav nav={<UserNavBar />}>
            {children}
        </AppShell>
    );
}