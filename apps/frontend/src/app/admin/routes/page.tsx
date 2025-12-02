"use client";

import { Button } from "@/src/components/ui/button";
import { Card, CardHeader } from "@/src/components/ui/card";
import Loading from "@/src/components/ui/loading";
import { SelectDropdown, OptionType } from "@/src/components/ui/select-dropdown";
import { useTRPC } from "@/src/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type SortOptionsType } from '@repo/shared';
import { Table } from "@/src/components/ui/table";
import Pagination from "@/src/components/ui/pagination";

export default function AdminManageRoutePage() {
    const router = useRouter();
    const trpc = useTRPC();

    const [sortOriginName, setSortOriginName] = useState<SortOptionsType>(undefined);
    const [sortDestinationName, setSortDestinationName] = useState<SortOptionsType>(undefined);

    const perPage = 20;
    const searchRoutesOpts = trpc.routes.search.queryOptions({
        page: 1,
        perPage,
        sortOriginName,
        sortDestinationName,
    });
    const searchRoutesQuery = useQuery({
        ...searchRoutesOpts,
        staleTime: 60 * 60 * 1000,
    });

    return (
        <div className="flex flex-col">
            <h1 className="text-[2rem] text-text dark:text-text font-bold mb-8">Manage Routes</h1>
            <Button variant="accent" className="self-start mb-8" onClick={() => router.push('/admin/routes/new')}>CREATE NEW ROUTE</Button>

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
                                ]}
                                onChange={(newValue, _) => {
                                    if (!newValue) {
                                        setSortOriginName(undefined);
                                        return;
                                    }
                                    const selectedValue: OptionType<string> = newValue as OptionType<string>;
                                    setSortOriginName(selectedValue.value as SortOptionsType);
                                }}
                            />
                        </div>
                        <div className="flex-1">
                            <SelectDropdown label="Destination Name" id="sort-destination-name" name="sort-destination-name" isClearable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                options={[
                                    { value: "asc", label: "Ascending" },
                                    { value: "desc", label: "Descending" },
                                ]}
                                onChange={(newValue, _) => {
                                    if (!newValue) {
                                        setSortDestinationName(undefined);
                                        return;
                                    }
                                    const selectedValue: OptionType<string> = newValue as OptionType<string>;
                                    setSortDestinationName(selectedValue.value as SortOptionsType);
                                }}
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        variant="accent"
                        size="lg"
                        className="m-6"
                        onClick={(e) => {
                            e.preventDefault();
                            searchRoutesQuery.refetch();
                        }}
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

            {searchRoutesQuery.isFetching ? (
                // <div className="text-text dark:text-text flex justify-center font-bold">Loading...</div>
                <Loading></Loading>
            ) : (
                <>
                    {searchRoutesQuery.isSuccess && searchRoutesQuery.data ? (
                        <Card className="flex">
                            <Table
                                data={searchRoutesQuery.data.data}
                                rowKey={(route) => `route-${route.id}`}
                                columns={[
                                    {
                                        header: "Origin",
                                        render: route => route.origin.name,
                                    },
                                    {
                                        header: "Destination",
                                        render: route => route.destination.name,
                                    },
                                    {
                                        header: "Distance",
                                        render: route => route.distanceKm,
                                    },
                                    {
                                        header: "Estimated Minutes",
                                        render: route => route.estimatedMinutes,
                                    },
                                    {
                                        header: "Actions",
                                        render: route => (
                                            <>
                                                <Button variant="accent" onClick={() => { router.push(`/admin/routes/edit/${route.id}`) }}>Edit</Button>
                                                <Button variant="danger">Delete</Button>
                                            </>
                                        ),
                                        className: "flex justify-center gap-2 py-2",
                                    },
                                ]}
                                tableClassName="flex-1"
                                headClassName="text-text dark:text-text font-bold"
                                bodyClassName="bg-primary dark:bg-primary"
                            />

                        </Card>
                    ) : (
                        <>Error Loading Route</>
                    )}
                    <Pagination currentPage={1} totalPage={1} loadPageFn={(page) => { }} />
                </>
            )}
        </div>
    );
}