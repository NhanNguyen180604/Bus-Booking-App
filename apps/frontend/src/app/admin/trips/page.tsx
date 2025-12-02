"use client";;
import { Button } from "@/src/components/ui/button";
import { Card, CardHeader } from "@/src/components/ui/card";
import Checkbox from "@/src/components/ui/checkbox";
import { SelectDropdown } from "@/src/components/ui/select-dropdown";
import { useTRPC } from "@/src/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function AdminManageTripPage() {
    const router = useRouter();
    const trpc = useTRPC();
    const busTypesQueryOpts = trpc.busTypes.find.queryOptions({ perPage: 999 });
    const busTypesQuery = useQuery({
        ...busTypesQueryOpts,
        staleTime: 5 * 60 * 1000,
    });

    return (
        <div className="flex flex-col">
            <h1 className="text-[32px] text-text dark:text-text font-bold mb-8">Manage Trips</h1>
            <Button variant="accent" className="self-start mb-8" onClick={() => router.push('/admin/trips/new')}>CREATE NEW TRIP</Button>

            {/* Sort and Filter */}
            <form>
                <Card className="flex flex-col mb-8">
                    <CardHeader className="text-text dark:text-text text-[20px] font-bold">FILTER</CardHeader>
                    <div className="flex px-6 border-b border-border dark:border-border pb-4">
                        <div className="flex flex-col gap-2 flex-1">
                            <span className="text-text dark:text-text font-bold text-[1rem]">Bus Type</span>
                            {busTypesQuery.isPending ? (
                                <div className="text-text dark:text-text">
                                    Loading...
                                </div>
                            ) : (
                                <>
                                    {busTypesQuery.data?.data.map(v => (
                                        <Checkbox title={v.name} id={v.id} name={`filter-${v.name}-bus`} key={v.id} />
                                    ))}
                                </>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 flex-1">
                            <span className="text-text dark:text-text font-bold text-[1rem]">Departure Time</span>
                            <div className="flex justify-between">
                                <Checkbox title="Early" id="filter-early-departure-time" name="filter-early-departure-time" />
                                <label htmlFor="filter-early-departure-time" className="text-secondary-text dark:text-secondary-text">06:00-11:00</label>
                            </div>
                            <div className="flex justify-between">
                                <Checkbox title="Midday" id="filter-midday-departure-time" name="filter-midday-departure-time" />
                                <label htmlFor="filter-midday-departure-time" className="text-secondary-text dark:text-secondary-text">11:00-17:00</label>
                            </div>
                            <div className="flex justify-between">
                                <Checkbox title="Late" id="filter-late-departure-time" name="filter-late-departure-time" />
                                <label htmlFor="filter-late-departure-time" className="text-secondary-text dark:text-secondary-text">17:00-00:00</label>
                            </div>
                            <div className="flex justify-between">
                                <Checkbox title="Midnight" id="filter-midnight-departure-time" name="filter-midnight-departure-time" />
                                <label htmlFor="filter-midnight-departure-time" className="text-secondary-text dark:text-secondary-text">00:00-06:00</label>
                            </div>
                        </div>
                    </div>
                    <CardHeader className="text-text dark:text-text text-[20px] font-bold">SORT</CardHeader>
                    <div className="flex px-6 border-b border-border dark:border-border pb-4 gap-8">
                        <div className="flex-1">
                            <SelectDropdown label="Departure Time" id="sort-departure-time" name="sort-departure-time" isClearable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                options={[
                                    { value: "asc", label: "Ascending" },
                                    { value: "desc", label: "Descending" },
                                    { value: "none", label: "None" },
                                ]}
                            />
                        </div>
                        <div className="flex-1">
                            <SelectDropdown label="Price" id="sort-price" name="sort-price" isClearable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                options={[
                                    { value: "asc", label: "Ascending" },
                                    { value: "desc", label: "Descending" },
                                    { value: "none", label: "None" },
                                ]}
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        variant="accent"
                        size="lg"
                        className="m-6"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        Search Trips
                    </Button>
                </Card>
            </form>

            <Card className="flex">
                <table className="flex-1">
                    <thead>
                        <tr>
                            <th>Origin</th>
                            <th>Destination</th>
                            <th>Bus Number</th>
                            <th>Departure Time</th>
                            <th>Price</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Ho Chi Minh</td>
                            <td>Da Lat</td>
                            <td>12345</td>
                            <td>03/12/2025 - 06:00</td>
                            <td>290.000 VND</td>
                            <td>
                                <Button variant="accent">Edit</Button>
                                <Button variant="danger">Delete</Button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </Card>
        </div>
    );
}