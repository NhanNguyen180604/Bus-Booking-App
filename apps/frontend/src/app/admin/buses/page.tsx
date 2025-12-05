"use client";;
import { Tab, TabPanel } from "@/src/components/ui/tab";
import AdminManageBusTypePage from "./types/page-component";
import AdminManageBusPage from "./page-component";

export default function AdminManageBusTabs() {
    return (
        <Tab>
            <TabPanel title="Bus">
                <AdminManageBusPage />
            </TabPanel>
            <TabPanel title="Bus Types">
                <AdminManageBusTypePage />
            </TabPanel>
        </Tab>
    )
}