import { usePathname } from "next/navigation";
import { Card } from "../ui/card";
import Link from "next/link";
import { DashboardIcon } from "../icons/dashboard-ic";
import { FinanceIcon } from "../icons/finance-ic";
import { TripIcon } from "../icons/trip-ic";
import { RouteIcon } from "../icons/route-ic";
import { StationIcon } from "../icons/station-ic";
import { BusIcon } from "../icons/bus-ic";
import { SteeringWheelIcon } from "../icons/steering-wheel";
import { PersonIcon } from "../icons/person";
import { ReportIcon } from "../icons/report-ic";
import { SettingsIcon } from "../icons/settings-ic";
import { BookingIcon } from "../icons/booking-ic";
import { PaymentIcon } from "../icons/payment-ic";

export function AdminNavBar() {
    return (
        <Card className="w-72 flex flex-col gap-8 p-4 sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="flex flex-col gap-2">
                <NavTab name="Dashboard" url="/admin" icon={DashboardIcon} />
                <NavTab name="Revenue" url="/admin/revenue" icon={FinanceIcon} />
            </div>
            <div className="flex flex-col gap-2">
                <NavTab name="Trips" url="/admin/trips" icon={TripIcon} />
                <NavTab name="Routes" url="/admin/routes" icon={RouteIcon} />
                <NavTab name="Stations" url="/admin/stations" icon={StationIcon} />
                <NavTab name="Buses" url="/admin/buses" icon={BusIcon} />
                <NavTab name="Drivers" url="/admin/drivers" icon={SteeringWheelIcon} />
            </div>
            <div className="flex flex-col gap-2">
                <NavTab name="Customers" url="/admin/customers" icon={PersonIcon} />
                <NavTab name="Reports" url="/admin/reports" icon={ReportIcon} />
            </div>
            <div className="flex flex-col gap-2">
                <NavTab name="Settings" url="/admin/settings" icon={SettingsIcon} />
            </div>
        </Card>
    );
}

export function UserNavBar() {
    return (
        <Card className="w-72 flex flex-col gap-8 p-4 sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="flex flex-col gap-2">
                <NavTab name="Bookings" url="/users/dashboard/bookings" icon={BookingIcon} />
                <NavTab name="Trips" url="/users/dashboard/trips" icon={TripIcon} />
                <NavTab name="Payments" url="/users/dashboard/payments" icon={PaymentIcon} />
            </div>
            <div className="flex flex-col gap-2">
                <NavTab name="Settings" url="/users/dashboard/settings" icon={SettingsIcon} />
            </div>
        </Card>
    );
}

interface NavTabProps {
    name: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    url: string;
}

function NavTab({ name, icon: Icon, url }: NavTabProps) {
    const pathName = usePathname();
    const selected = pathName === url;
    return (
        <Link href={url}
            className={`flex gap-4 px-9 py-2 rounded-md text-base hover:bg-primary
                        ${selected ? "bg-primary dark:bg-primary text-accent dark:text-accent font-bold" : "text-secondary-text dark:text-secondary-text hover:text-text hover:dark:text-text"}`}
        >
            <Icon width={24} height={24} />
            {name}
        </Link>
    );
}