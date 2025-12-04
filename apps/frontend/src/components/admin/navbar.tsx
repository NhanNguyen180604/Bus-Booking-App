import { usePathname } from "next/navigation";
import { Card } from "../ui/card";
import Image from 'next/image';
import Link from "next/link";

export default function AdminNavBar() {
    return (
        <Card className="w-72 flex flex-col gap-8 p-4 sticky top-[5rem] h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="flex flex-col gap-2">
                <AdminNavTab name="Dashboard" url="/admin" iconPath="/icons/dashboard-ic.svg" />
                <AdminNavTab name="Revenue" url="/admin/revenue" iconPath="/icons/finance-ic.svg" />
            </div>
            <div className="flex flex-col gap-2">
                <AdminNavTab name="Trips" url="/admin/trips" iconPath="/icons/trip-ic.svg" />
                <AdminNavTab name="Routes" url="/admin/routes" iconPath="/icons/route-ic.svg" />
                <AdminNavTab name="Buses" url="/admin/buses" iconPath="/icons/bus-ic.svg" />
                <AdminNavTab name="Drivers" url="/admin/drivers" iconPath="/icons/steering-wheel.svg" />
            </div>
            <div className="flex flex-col gap-2">
                <AdminNavTab name="Customers" url="/admin/customers" iconPath="/icons/person.svg" />
                <AdminNavTab name="Reports" url="/admin/reports" iconPath="/icons/report-ic.svg" />
            </div>
            <div className="flex flex-col gap-2">
                <AdminNavTab name="Settings" url="/admin/settings" iconPath="/icons/settings-ic.svg" />
            </div>
        </Card>
    );
}

interface AdminNavTabProps {
    name: string;
    iconPath: string;
    url: string;
}

function AdminNavTab({ name, iconPath, url }: AdminNavTabProps) {
    const pathName = usePathname();
    const selected = pathName === url || (pathName.startsWith(url) && url !== '/admin');
    return (
        <Link href={url}
            className={`flex gap-4 px-9 py-2 rounded-md text-[16px] hover:bg-primary
                        ${selected ? "bg-primary dark:bg-primary text-accent dark:text-accent font-bold" : "text-text dark:text-text"}`}
        >
            <Image src={iconPath} alt={`${name} icon`} width={24} height={24} />
            {name}
        </Link>
    );
}