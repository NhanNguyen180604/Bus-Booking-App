"use client";

import { Button } from "@/src/components/ui/button";
import { Card, CardHeader } from "@/src/components/ui/card";
import { SelectDropdown } from "@/src/components/ui/select-dropdown";
import { useRouter } from "next/navigation";

export default function AdminManageBusPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col">
            <h1 className="text-[32px] text-text dark:text-text font-bold mb-8">Manage Buses</h1>
            <Button variant="accent" className="self-start mb-8" onClick={() => router.push('/admin/buses/new')}>CREATE NEW BUS</Button>

            {/* Sort and Filter */}
            <form>
                <Card className="flex flex-col mb-8">
                    <CardHeader className="text-text dark:text-text text-[20px] font-bold">SORT</CardHeader>
                    <div className="flex px-6 border-b border-border dark:border-border pb-4 gap-8">
                        <div className="flex-1">
                            <SelectDropdown label="Origin Name" id="sort-origin-name" name="sort-origin-name" isClearable
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
                            <SelectDropdown label="Destination Name" id="sort-destination-name" name="sort-destination-name" isClearable
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
                        Search Routes
                    </Button>
                </Card>
            </form>

            <Card className="flex">
                <table className="flex-1">
                    <thead>
                        <tr>
                            <th>Origin</th>
                            <th>Destination</th>
                            <th>Distance (km)</th>
                            <th>Estimated Minutes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Ho Chi Minh</td>
                            <td>Da Lat</td>
                            <td>1300</td>
                            <td>480</td>
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