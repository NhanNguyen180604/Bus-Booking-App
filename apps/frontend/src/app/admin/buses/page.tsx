"use client"
import { Tab, TabPanel } from "@/src/components/ui/tab";
import AdminManageBusTypePage from "./types/page-component";
import AdminManageBusPage from "./page-component";
import { useSearchParams } from "next/navigation";

export default function AdminManageBusTabs() {
    const searchParams = useSearchParams();
    const tab = Number(searchParams.get("tab") ?? 0);
    return (
        <Tab initialActiveTab={tab}>
            <TabPanel title="Bus">
                <AdminManageBusPage />
            </TabPanel>
            <TabPanel title="Bus Types">
                <AdminManageBusTypePage />
            </TabPanel>
        </Tab>
    )
}