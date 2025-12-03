"use client"
import { Button } from "@/src/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/src/components/ui/card";
import { SelectDropdown, OptionType } from "@/src/components/ui/select-dropdown";
import { useTRPC } from "@/src/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type SortOptionsType } from '@repo/shared';
import { Table } from "@/src/components/ui/table";
import Pagination from "@/src/components/ui/pagination";
import { FormField } from "@/src/components/ui/form-field";
import { type RouterOutputsType } from 'backend';
import Modal from "@/src/components/ui/modal";

type Route = RouterOutputsType['routes']['findOneById'];

export default function AdminManageRoutePage() {
    const router = useRouter();
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    // zodResolver for react hook form doesn't work for some reasons
    // it keeps saying mistmatching
    const [sortOriginName, setSortOriginName] = useState<SortOptionsType>(undefined);
    const [sortDestinationName, setSortDestinationName] = useState<SortOptionsType>(undefined);

    // searching route
    // clunky as hell
    const [originInput, setOriginInput] = useState("");
    const [destinationInput, setDestinationInput] = useState("");
    const [originQuery, setOriginQuery] = useState<string | undefined>(undefined);
    const [destinationQuery, setDestinationQuery] = useState<string | undefined>(undefined);

    const perPage = 2;
    const [page, setPage] = useState(1);
    const [totalPage, setTotalPage] = useState(1);
    const searchRoutesOpts = trpc.routes.search.queryOptions({
        page,
        perPage,
        sortOriginName,
        sortDestinationName,
        originNameQuery: originQuery,
        destinationNameQuery: destinationQuery,
    });
    const searchRoutesQuery = useQuery({
        ...searchRoutesOpts,
        staleTime: 60 * 60 * 1000,
    });

    useEffect(() => {
        if (searchRoutesQuery.isSuccess) {
            if (searchRoutesQuery.data.totalPage !== totalPage) {
                setTotalPage(searchRoutesQuery.data.totalPage);
                setPage(1);
            }
        }
    }, [searchRoutesQuery.isFetching]);

    // deleting route
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingRoute, setDeletingRoute] = useState<Route>(null);
    const [deleteRouteError, setDeleteRouteError] = useState<string>();
    const deleteRouteOpts = trpc.routes.deleteOne.mutationOptions();
    const deleteRouteMutation = useMutation({
        ...deleteRouteOpts,
        onError(error) {
            setDeleteRouteError(error.message);
        },
        onSuccess(_, variables) {
            onDeleteModalClose();
            queryClient.removeQueries({ queryKey: trpc.routes.findOneById.queryKey({ id: variables.id }) });
            queryClient.invalidateQueries({ queryKey: trpc.routes.search.queryKey() });
        },
    });

    const onDeleteModalClose = () => {
        setShowDeleteModal(false);
        setDeletingRoute(null);
        setShowDeleteModal(false);
        setDeleteRouteError(undefined);
    };

    return (
        <div className="flex flex-col">
            <h1 className="text-[2rem] text-text dark:text-text font-bold mb-8">Manage Routes</h1>
            <Button variant="accent" className="self-start mb-8" onClick={() => router.push('/admin/routes/new')}>CREATE NEW ROUTE</Button>

            {/* Sort and Filter */}
            <form>
                <Card className="flex flex-col mb-8">
                    <CardHeader className="text-text dark:text-text text-[20px] font-bold">QUERY</CardHeader>
                    <CardBody className="flex px-6 border-b border-border dark:border-border pb-4 gap-8">
                        <div className="flex-1">
                            <FormField label="Origin Name Query"
                                placeholder="Ho Chi Minh"
                                value={originInput}
                                onChange={(e) => setOriginInput(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <FormField label="Destination Name Query"
                                placeholder="Da Lat"
                                value={destinationInput}
                                onChange={(e) => setDestinationInput(e.target.value)}
                            />
                        </div>
                    </CardBody>
                    <CardHeader className="text-text dark:text-text text-[20px] font-bold">SORT</CardHeader>
                    <CardBody className="flex px-6 border-b border-border dark:border-border pb-4 gap-8">
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
                    </CardBody>
                    <Button
                        type="submit"
                        variant="accent"
                        size="lg"
                        className="m-6"
                        onClick={(e) => {
                            e.preventDefault();
                            setOriginQuery(originInput || undefined);
                            setDestinationQuery(destinationInput || undefined);
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

            {/* table here baby */}
            {searchRoutesQuery.isFetching ? (
                <div className="text-text dark:text-text flex justify-center font-bold">Loading...</div>
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
                                                <Button className="flex-1" variant="accent" onClick={() => { router.push(`/admin/routes/edit/${route.id}`) }}>Edit</Button>
                                                <Button className="flex-1" variant="danger"
                                                    onClick={(e) => {
                                                        setShowDeleteModal(true);
                                                        setDeletingRoute(route);
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            </>
                                        ),
                                        className: "flex justify-center gap-2 py-2 px-6",
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
                </>
            )}
            {!searchRoutesQuery.isError && (
                <div className="mt-8 flex justify-center">
                    <Pagination currentPage={page} totalPage={totalPage} loadPageFn={(newPage) => {
                        setPage(newPage);
                    }} />
                </div>
            )}

            <Modal open={showDeleteModal} onClose={() => onDeleteModalClose()}>
                <Card onClick={(e) => e.stopPropagation()} className="max-w-lg min-w-lg">
                    <CardHeader>
                        <h1 className="text-text dark:text-text font-bold text-xl">
                            Are you sure you want to delete this route?
                        </h1>
                        {deleteRouteError && (
                            <div className="text-danger dark:text-danger font-bold mt-4">{deleteRouteError}</div>
                        )}
                    </CardHeader>
                    <CardBody className="text-text dark:text-text">
                        <div>ID: {deletingRoute?.id}</div>
                        <div>Origin: {deletingRoute?.origin.name}</div>
                        <div>Destination: {deletingRoute?.destination.name}</div>
                        <div>Distance (km): {deletingRoute?.distanceKm}</div>
                        <div>Estimated minutes: {deletingRoute?.estimatedMinutes}</div>
                    </CardBody>
                    <CardFooter className="flex justify-between gap-6">
                        <Button variant="danger"
                            className="flex-1"
                            disabled={deleteRouteMutation.isPending}
                            onClick={() => {
                                if (deletingRoute) {
                                    deleteRouteMutation.mutate({ id: deletingRoute.id });
                                }
                            }}>
                            {deleteRouteMutation.isPending ? "Deleting..." : "Confirm"}
                        </Button>
                        <Button variant="primary"
                            className="flex-1"
                            onClick={() => onDeleteModalClose()}>
                            Cancel
                        </Button>
                    </CardFooter>
                </Card>
            </Modal>
        </div>
    );
}