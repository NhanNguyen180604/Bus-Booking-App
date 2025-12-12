"use client";
import { Button } from "@/src/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/src/components/ui/card";
import { SelectDropdown, OptionType } from "@/src/components/ui/select-dropdown";
import { useTRPC } from "@/src/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StationSearchDtoType, type SortOptionsType } from '@repo/shared';
import { Table } from "@/src/components/ui/table";
import Pagination from "@/src/components/ui/pagination";
import { FormField } from "@/src/components/ui/form-field";
import { type RouterOutputsType } from 'backend';
import Modal from "@/src/components/ui/modal";

type Station = RouterOutputsType['stations']['search']['data'][number];

export default function AdminManageStationPage() {
    const router = useRouter();
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const perPage = 20;

    const [stationTotalPage, setStationTotalPage] = useState(1);

    const [stationSearchInput, setStationSearchInput] = useState<StationSearchDtoType>({
        page: 1,
        perPage: perPage,
        nameQuery: '',
    });
    const [stationSearchObj, setStationSearchObj] = useState<StationSearchDtoType>(stationSearchInput);

    const searchStationOpts = trpc.stations.search.queryOptions(stationSearchObj);
    const searchStationQuery = useQuery({
        ...searchStationOpts,
        staleTime: 60 * 60 * 1000,
    });

    useEffect(() => {
        if (searchStationQuery.isSuccess) {
            if (searchStationQuery.data.totalPage !== stationTotalPage) {
                setStationSearchInput({
                    ...stationSearchInput,
                    page: 1,
                });
                setStationSearchObj({
                    ...stationSearchObj,
                    page: 1,
                });
                setStationTotalPage(searchStationQuery.data.totalPage);
            }
        }
    }, [searchStationQuery.isFetching]);

    // deleting station
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingStation, setDeletingStation] = useState<Station | null>(null);
    const [deleteStationError, setDeleteStationError] = useState<string>();
    const deleteStationOpts = trpc.stations.deleteOne.mutationOptions();
    const deleteStationMutation = useMutation({
        ...deleteStationOpts,
        onError(error) {
            setDeleteStationError(error.message);
        },
        onSuccess(_, variables) {
            onDeleteModalClose();
            queryClient.removeQueries({ queryKey: trpc.stations.findOne.queryKey({ id: variables.id }) });
            queryClient.invalidateQueries({ queryKey: trpc.stations.search.queryKey() });
        },
    });

    const onDeleteModalClose = () => {
        setShowDeleteModal(false);
        setDeletingStation(null);
        setDeleteStationError(undefined);
    };

    return (
        <div className="flex flex-col">
            <h1 className="text-[2rem] text-text dark:text-text font-bold mb-8">Manage Stations</h1>
            <div className="flex gap-4">
                <Button variant="accent" className="self-start mb-8" onClick={() => router.push('/admin/stations/new')}>CREATE NEW STATION</Button>
            </div>

            {/* Sort and Filter */}
            <form>
                <Card className="flex flex-col mb-8">
                    <CardHeader className="text-text dark:text-text text-[20px] font-bold">QUERY AND SORT STATIONS</CardHeader>

                    <CardBody className="flex px-6 border-b border-border dark:border-border pb-4 gap-8">
                        <div className="flex-1">
                            <FormField label="Station Name Query"
                                placeholder="Hanoi"
                                value={stationSearchInput.nameQuery}
                                onChange={(e) => setStationSearchInput({
                                    ...stationSearchInput,
                                    nameQuery: e.target.value,
                                })}
                            />
                        </div>
                        <div className="flex-1">
                            <SelectDropdown label="Sort Station Name" id="sort-station-name" name="sort-station-name" isClearable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                options={[
                                    { value: "asc", label: "Ascending" },
                                    { value: "desc", label: "Descending" },
                                ]}
                                onChange={(newValue, _) => {
                                    const newVal: OptionType<string> = newValue as OptionType<string>;
                                    setStationSearchInput({
                                        ...stationSearchInput,
                                        sortName: newVal ? newVal.value as "asc" | "desc" : undefined,
                                    })
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
                            setStationSearchObj(stationSearchInput);
                            searchStationQuery.refetch();
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
                        Search Stations
                    </Button>
                </Card>
            </form>

            {/* table here baby */}
            {searchStationQuery.isFetching ? (
                <div className="text-text dark:text-text flex justify-center font-bold">Loading...</div>
            ) : (
                <>
                    {searchStationQuery.isSuccess && searchStationQuery.data.data.length ? (
                        <Card className="flex overflow-hidden">
                            <Table
                                data={searchStationQuery.data.data}
                                rowKey={(station) => `station-${station.id}`}
                                columns={[
                                    {
                                        header: "Name",
                                        render: station => station.name,
                                    },
                                    {
                                        header: "Actions",
                                        render: station => (
                                            <>
                                                <Button className="flex-1 max-w-32"
                                                    variant="accent"
                                                    onClick={() => { router.push(`/admin/stations/edit/${station.id}`) }}
                                                >
                                                    Edit
                                                </Button>
                                                <Button className="flex-1 max-w-32"
                                                    variant="danger"
                                                    onClick={(_) => {
                                                        setShowDeleteModal(true);
                                                        setDeletingStation(station);
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
                        <div className="text-text dark:text-text font-semibold text-center">No Station Found</div>
                    )}
                </>
            )}
            {!searchStationQuery.isError && (
                <div className="mt-8 flex justify-center">
                    <Pagination currentPage={stationSearchInput.page} totalPage={stationTotalPage} loadPageFn={(newPage) => {
                        setStationSearchInput({
                            ...stationSearchInput,
                            page: newPage,
                        });
                        setStationSearchObj({
                            ...stationSearchObj,
                            page: newPage,
                        });
                    }} />
                </div>
            )}

            <Modal open={showDeleteModal} onClose={() => onDeleteModalClose()}>
                <Card onClick={(e) => e.stopPropagation()} className="max-w-lg min-w-lg">
                    <CardHeader>
                        <h1 className="text-text dark:text-text font-bold text-xl">
                            Are you sure you want to delete this station?
                        </h1>
                        {deleteStationError && (
                            <div className="text-danger dark:text-danger font-bold mt-4">{deleteStationError}</div>
                        )}
                    </CardHeader>
                    <CardBody className="text-text dark:text-text">
                        <div>ID: {deletingStation?.id}</div>
                        <div>Name: {deletingStation?.name}</div>
                    </CardBody>
                    <CardFooter className="flex justify-between gap-6">
                        <Button variant="danger"
                            className="flex-1"
                            disabled={deleteStationMutation.isPending}
                            onClick={() => {
                                if (deletingStation) {
                                    deleteStationMutation.mutate({ id: deletingStation.id });
                                }
                            }}>
                            {deleteStationMutation.isPending ? "Deleting..." : "Confirm"}
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