"use client"
import { Button } from "@/src/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/src/components/ui/card";
import { SelectDropdown, OptionType } from "@/src/components/ui/select-dropdown";
import { useTRPC } from "@/src/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BusSearchDtoType, type SortOptionsType } from '@repo/shared';
import { Table } from "@/src/components/ui/table";
import Pagination from "@/src/components/ui/pagination";
import { FormField } from "@/src/components/ui/form-field";
import { type RouterOutputsType } from 'backend';
import Modal from "@/src/components/ui/modal";

type Bus = RouterOutputsType['buses']['getOneById'];
type BusType = RouterOutputsType['busTypes']['getOneById'];
type User = RouterOutputsType['users']['search']['data'][number];

export default function AdminManageBusPage() {
    const router = useRouter();
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const perPage = 20;

    // fetching drivers for dropdown
    const [drivers, setDrivers] = useState<User[]>([]);
    const driverTotalPageNumber = useRef(1);
    const [driverPage, setDriverPage] = useState(1);

    const searchDriverQueryOpts = trpc.users.search.queryOptions({
        role: "DRIVER",
        page: driverPage,
        perPage,
    });
    const searchDriverQuery = useQuery({
        ...searchDriverQueryOpts,
        staleTime: 60 * 60 * 1000,
    });
    // appending drivers whenever successfully fetch
    useEffect(() => {
        if (searchDriverQuery.isSuccess) {
            driverTotalPageNumber.current = searchDriverQuery.data.totalPage;
            setDrivers([...drivers, ...searchDriverQuery.data.data]);
        }
    }, [searchDriverQuery.isSuccess]);

    // fetching bus types for dropdown
    const [busTypes, setBusTypes] = useState<BusType[]>([]);
    const busTypesTotalPageNumber = useRef(1);
    const [busTypePage, setBusTypePage] = useState(1);

    const searchBusTypeQueryOpts = trpc.busTypes.search.queryOptions({
        page: busTypePage,
        perPage,
    });
    const searchBusTypeQuery = useQuery({
        ...searchBusTypeQueryOpts,
        staleTime: 60 * 60 * 1000,
    });
    // appending bus types whenever successfully fetch
    useEffect(() => {
        if (searchBusTypeQuery.isSuccess) {
            driverTotalPageNumber.current = searchBusTypeQuery.data.totalPage;
            setBusTypes([...busTypes, ...searchBusTypeQuery.data.data]);
        }
    }, [searchBusTypeQuery.isSuccess]);


    // actually searching for bus here
    const [busPage, setBusPage] = useState(1);
    const [busTotalPage, setBusTotalPage] = useState(1);

    // zodResolver for react hook form doesn't work for some reasons
    // it keeps saying mistmatching
    const [busSearchQueryInput, setBusSearchQueryInput] = useState<BusSearchDtoType>({
        page: busPage,
        perPage,
        driverId: undefined,
        driverNameSort: undefined,
        plateNumberQuery: undefined,
        plateNumberSort: undefined,
        typeId: undefined,
    });
    // the actual state used in query
    const [busSearchQueryObj, setBusSearchQueryObj] = useState<BusSearchDtoType>(busSearchQueryInput);
    const busSearchQueryOpts = trpc.buses.searchBus.queryOptions(busSearchQueryObj);
    const busSearchQuery = useQuery({
        ...busSearchQueryOpts,
        staleTime: 60 * 60 * 1000,
    });

    useEffect(() => {
        if (busSearchQuery.isSuccess) {
            if (busSearchQuery.data.totalPage !== busTotalPage) {
                setBusTotalPage(busSearchQuery.data.totalPage);
                setBusPage(1);
            }
        }
    }, [busSearchQuery.isFetching]);

    // deleting bus
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingBus, setDeletingBus] = useState<Bus | null>(null);
    const [deleteBusError, setDeleteBusError] = useState<string>();
    const deleteBusOpts = trpc.buses.deleteOne.mutationOptions();
    const deleteBusMutation = useMutation({
        ...deleteBusOpts,
        onError(error) {
            setDeleteBusError(error.message);
        },
        onSuccess(_, variables) {
            onDeleteModalClose();
            queryClient.removeQueries({ queryKey: trpc.buses.getOneById.queryKey({ id: variables.id }) });
            queryClient.invalidateQueries({ queryKey: trpc.buses.searchBus.queryKey() });
        },
    });

    const onDeleteModalClose = () => {
        setShowDeleteModal(false);
        setDeletingBus(null);
        setShowDeleteModal(false);
        setDeleteBusError(undefined);
    };

    return (
        <div className="flex flex-col">
            <h1 className="text-[2rem] text-text dark:text-text font-bold mb-8">Manage Buses</h1>
            <div className="flex gap-4">
                <Button variant="accent" className="self-start mb-8" onClick={() => router.push('/admin/buses/new')}>CREATE NEW BUS</Button>
            </div>

            {/* Sort and Filter */}
            <form>
                <Card className="flex flex-col mb-8">
                    <CardHeader className="text-text dark:text-text text-[20px] font-bold">QUERY</CardHeader>
                    <CardBody className="flex px-6 border-b border-border dark:border-border pb-4 gap-8">
                        <div className="flex-1">
                            <SelectDropdown label="Driver" isClearable
                                options={drivers.map(driver => ({ value: driver.id, label: driver.name }))}
                                onChange={(newValue, _) => {
                                    const newVal: OptionType<string> = newValue as OptionType<string>;
                                    setBusSearchQueryInput({
                                        ...busSearchQueryInput,
                                        driverId: newVal?.value,
                                    });
                                }}
                                onMenuScrollToBottom={(_) => {
                                    if (driverPage < driverTotalPageNumber.current) {
                                        setDriverPage(driverPage + 1);
                                    }
                                }}
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                            />
                        </div>
                        <div className="flex-1">
                            <SelectDropdown label="Bus Type" isClearable
                                options={busTypes.map(busType => ({ value: busType.id, label: busType.name }))}
                                onChange={(newValue, _) => {
                                    const newVal: OptionType<string> = newValue as OptionType<string>;
                                    setBusSearchQueryInput({
                                        ...busSearchQueryInput,
                                        typeId: newVal?.value,
                                    });
                                }}
                                onMenuScrollToBottom={(_) => {
                                    if (busTypePage < busTypesTotalPageNumber.current) {
                                        setBusTypePage(busTypePage + 1);
                                    }
                                }}
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                            />
                        </div>
                        <div className="flex-1">
                            <FormField
                                label="Plate Number Query"
                                placeholder="12345"
                                value={busSearchQueryInput.plateNumberQuery ?? ""}
                                onChange={(e) => {
                                    setBusSearchQueryInput({
                                        ...busSearchQueryInput,
                                        plateNumberQuery: e.target.value,
                                    });
                                }}
                            />
                        </div>
                    </CardBody>

                    <CardHeader className="text-text dark:text-text text-[20px] font-bold">SORT</CardHeader>
                    <CardBody className="flex px-6 border-b border-border dark:border-border pb-4 gap-8">
                        <div className="flex-1">
                            <SelectDropdown label="Driver Name Sort" id="sort-driver-name" name="sort-driver-name" isClearable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                options={[
                                    { value: "asc", label: "Ascending" },
                                    { value: "desc", label: "Descending" },
                                ]}
                                onChange={(newValue, _) => {
                                    const newVal: OptionType<string> = newValue as OptionType<string>;
                                    setBusSearchQueryInput({
                                        ...busSearchQueryInput,
                                        driverNameSort: newVal ? newVal.value as SortOptionsType : undefined,
                                    });
                                }}
                            />
                        </div>
                        <div className="flex-1">
                            <SelectDropdown label="Plate Number Sort" id="sort-plate-number" name="sort-plate-number" isClearable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                options={[
                                    { value: "asc", label: "Ascending" },
                                    { value: "desc", label: "Descending" },
                                ]}
                                onChange={(newValue, _) => {
                                    const newVal: OptionType<string> = newValue as OptionType<string>;
                                    setBusSearchQueryInput({
                                        ...busSearchQueryInput,
                                        plateNumberSort: newVal ? newVal.value as SortOptionsType : undefined,
                                    });
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
                            setBusSearchQueryObj(busSearchQueryInput);
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
                        Search Bus Types
                    </Button>
                </Card>
            </form>

            {/* table here baby */}
            {busSearchQuery.isFetching ? (
                <div className="text-text dark:text-text flex justify-center font-bold">Loading...</div>
            ) : (
                <>
                    {busSearchQuery.isSuccess && busSearchQuery.data ? (
                        <Card className="flex overflow-hidden">
                            <Table
                                data={busSearchQuery.data.data}
                                rowKey={(bus) => `bus-${bus.id}`}
                                columns={[
                                    {
                                        header: "Plate Number",
                                        render: bus => bus.plateNumber,
                                    },
                                    {
                                        header: "Type",
                                        render: bus => bus.type.name,
                                    },
                                    {
                                        header: "Driver Name",
                                        render: bus => bus.driver?.name ?? "No driver",
                                    },
                                    {
                                        header: "Driver Phone",
                                        render: bus => bus.driver ? bus.driver.email ?? "No phone" : "No driver",
                                    },
                                    {
                                        header: "Driver Email",
                                        render: bus => bus.driver ? bus.driver.email ?? "No email" : "No driver",
                                    },
                                    {
                                        header: "Actions",
                                        render: bus => (
                                            <>
                                                <Button className="flex-1 max-w-32"
                                                    variant="accent"
                                                    onClick={() => { router.push(`/admin/buses/edit/${bus.id}`) }}
                                                >
                                                    Edit
                                                </Button>
                                                <Button className="flex-1 max-w-32"
                                                    variant="danger"
                                                    onClick={(_) => {
                                                        setShowDeleteModal(true);
                                                        setDeletingBus(bus);
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
            {!searchBusTypeQuery.isError && (
                <div className="mt-8 flex justify-center">
                    <Pagination currentPage={busPage} totalPage={busTotalPage} loadPageFn={(newPage) => {
                        setBusPage(newPage);
                    }} />
                </div>
            )}

            <Modal open={showDeleteModal} onClose={() => onDeleteModalClose()}>
                <Card onClick={(e) => e.stopPropagation()} className="max-w-lg min-w-lg">
                    <CardHeader>
                        <h1 className="text-text dark:text-text font-bold text-xl">
                            Are you sure you want to delete this bus type?
                        </h1>
                        {deleteBusError && (
                            <div className="text-danger dark:text-danger font-bold mt-4">{deleteBusError}</div>
                        )}
                    </CardHeader>
                    <CardBody className="text-text dark:text-text">
                        <div>ID: {deletingBus?.id}</div>
                        <div>Plate Number: {deletingBus?.plateNumber}</div>
                        {deletingBus?.driver ? (
                            <>
                                <div>Driver Name: {deletingBus?.driver?.name}</div>
                                <div>Driver Phone: {deletingBus?.driver.email ?? "No phone"}</div>
                                <div>Driver Email: {deletingBus?.driver.email ?? "No email"}</div>
                            </>
                        ) : (
                            <div>No driver</div>
                        )}
                    </CardBody>
                    <CardFooter className="flex justify-between gap-6">
                        <Button variant="danger"
                            className="flex-1"
                            disabled={deleteBusMutation.isPending}
                            onClick={() => {
                                if (deletingBus) {
                                    deleteBusMutation.mutate({ id: deletingBus.id });
                                }
                            }}>
                            {deleteBusMutation.isPending ? "Deleting..." : "Confirm"}
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