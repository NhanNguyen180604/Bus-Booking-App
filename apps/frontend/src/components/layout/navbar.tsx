import { usePathname } from "next/navigation";
import { Card } from "../ui/card";
import Image from 'next/image';
import Link from "next/link";

export function AdminNavBar() {
    return (
        <Card className="w-72 flex flex-col gap-8 p-4 sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="flex flex-col gap-2">
                <NavTab name="Dashboard" url="/admin" iconPath="/icons/dashboard-ic.svg" />
                <NavTab name="Revenue" url="/admin/revenue" iconPath="/icons/finance-ic.svg" />
            </div>
            <div className="flex flex-col gap-2">
                <NavTab name="Trips" url="/admin/trips" iconPath="/icons/trip-ic.svg" />
                <NavTab name="Routes" url="/admin/routes" iconPath="/icons/route-ic.svg" />
                <NavTab name="Buses" url="/admin/buses" iconPath="/icons/bus-ic.svg" />
                <NavTab name="Drivers" url="/admin/drivers" iconPath="/icons/steering-wheel.svg" />
            </div>
            <div className="flex flex-col gap-2">
                <NavTab name="Customers" url="/admin/customers" iconPath="/icons/person.svg" />
                <NavTab name="Reports" url="/admin/reports" iconPath="/icons/report-ic.svg" />
            </div>
            <div className="flex flex-col gap-2">
                <NavTab name="Settings" url="/admin/settings" iconPath="/icons/settings-ic.svg" />
            </div>
        </Card>
    );
}

export function UserNavBar() {
    return (
        <Card className="w-72 flex flex-col gap-8 p-4 sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="flex flex-col gap-2">
                <NavTab name="Bookings" url="/users/dashboard/bookings" iconPath="/icons/booking-ic.svg" />
                <NavTab name="Trips" url="/users/dashboard/trips" iconPath="/icons/trip-ic.svg" />
                <NavTab name="Payments" url="/users/dashboard/payments" iconPath="/icons/payment-ic.svg" />
            </div>
            <div className="flex flex-col gap-2">
                <NavTab name="Settings" url="/users/dashboard/settings" iconPath="/icons/settings-ic.svg" />
            </div>
        </Card>
    );
}

interface NavTabProps {
    name: string;
    iconPath: string;
    url: string;
}

function NavTab({ name, iconPath, url }: NavTabProps) {
    const pathName = usePathname();
    const selected = pathName === url;
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