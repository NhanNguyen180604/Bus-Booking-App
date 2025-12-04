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

type BusType = RouterOutputsType['busTypes']['getOneById'];

export default function AdminManageBusTypePage() {
    const router = useRouter();
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    // zodResolver for react hook form doesn't work for some reasons
    // it keeps saying mistmatching
    const [sortBusTypeName, setSortBusTypeName] = useState<SortOptionsType>(undefined);
    const [sortBusTypePriceMulti, setSortBusTypePriceMulti] = useState<SortOptionsType>(undefined);

    // searching bus type
    // clunky as hell
    const [busTypeNameQueryInput, setBusTypeNameQueryInput] = useState("");
    const [busTypeNameQuery, setBusTypeNameQuery] = useState<string | undefined>(undefined);

    const perPage = 20;
    const [busTypePage, setBusTypePage] = useState(1);
    const [busTypeTotalPage, setBusTypeTotalPage] = useState(1);
    const searchBusTypeOpts = trpc.busTypes.search.queryOptions({
        page: busTypePage,
        perPage,
        sortName: sortBusTypeName,
        sortPriceMultiplier: sortBusTypePriceMulti,
        nameQuery: busTypeNameQuery,
    });
    const searchBusTypeQuery = useQuery({
        ...searchBusTypeOpts,
        staleTime: 60 * 60 * 1000,
    });

    useEffect(() => {
        if (searchBusTypeQuery.isSuccess) {
            if (searchBusTypeQuery.data.totalPage !== busTypeTotalPage) {
                setBusTypeTotalPage(searchBusTypeQuery.data.totalPage);
                setBusTypePage(1);
            }
        }
    }, [searchBusTypeQuery.isFetching]);

    // deleting bus type
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingBusType, setDeletingBusType] = useState<BusType | null>(null);
    const [deleteBusTypeError, setDeleteBusTypeError] = useState<string>();
    const deleteBusTypeOpts = trpc.busTypes.deleteOne.mutationOptions();
    const deleteBusTypeMutation = useMutation({
        ...deleteBusTypeOpts,
        onError(error) {
            setDeleteBusTypeError(error.message);
        },
        onSuccess(_, variables) {
            onDeleteModalClose();
            queryClient.removeQueries({ queryKey: trpc.busTypes.getOneById.queryKey({ id: variables.id }) });
            queryClient.invalidateQueries({ queryKey: trpc.busTypes.search.queryKey() });
        },
    });

    const onDeleteModalClose = () => {
        setShowDeleteModal(false);
        setDeletingBusType(null);
        setDeleteBusTypeError(undefined);
    };

    return (
        <div className="flex flex-col">
            <h1 className="text-[2rem] text-text dark:text-text font-bold mb-8">Manage Bus Types</h1>
            <div className="flex gap-4">
                <Button variant="accent" className="self-start mb-8" onClick={() => router.push('/admin/buses/types/new')}>CREATE NEW BUS TYPE</Button>
            </div>

            {/* Sort and Filter */}
            <form>
                <Card className="flex flex-col mb-8">
                    <CardHeader className="text-text dark:text-text text-[20px] font-bold">QUERY AND SORT BUS TYPES</CardHeader>

                    <CardBody className="flex px-6 border-b border-border dark:border-border pb-4 gap-8">
                        <div className="flex-1">
                            <FormField label="Bus Type Name Query"
                                placeholder="Sleeper"
                                value={busTypeNameQueryInput}
                                onChange={(e) => setBusTypeNameQueryInput(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <SelectDropdown label="Sort Bus Type Name" id="sort-bus-type-name" name="sort-bus-type-name" isClearable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                options={[
                                    { value: "asc", label: "Ascending" },
                                    { value: "desc", label: "Descending" },
                                ]}
                                onChange={(newValue, _) => {
                                    const newVal: OptionType<string> = newValue as OptionType<string>;
                                    setSortBusTypeName(newVal ? newVal.value as SortOptionsType : undefined);
                                }}
                            />
                        </div>
                        <div className="flex-1">
                            <SelectDropdown label="Sort Bus Type Price Multiplier" id="sort-bus-type-price-multi" name="sort-bus-type-price-multi" isClearable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                options={[
                                    { value: "asc", label: "Ascending" },
                                    { value: "desc", label: "Descending" },
                                ]}
                                onChange={(newValue, _) => {
                                    const newVal: OptionType<string> = newValue as OptionType<string>;
                                    setSortBusTypePriceMulti(newVal ? newVal.value as SortOptionsType : undefined);
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
                            setBusTypeNameQuery(busTypeNameQueryInput || undefined);
                            searchBusTypeQuery.refetch();
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
            {searchBusTypeQuery.isFetching ? (
                <div className="text-text dark:text-text flex justify-center font-bold">Loading...</div>
            ) : (
                <>
                    {searchBusTypeQuery.isSuccess && searchBusTypeQuery.data ? (
                        <Card className="flex overflow-hidden">
                            <Table
                                data={searchBusTypeQuery.data.data}
                                rowKey={(busType) => `bus-type-${busType.id}`}
                                columns={[
                                    {
                                        header: "Name",
                                        render: busType => busType.name,
                                    },
                                    {
                                        header: "Actions",
                                        render: busType => (
                                            <>
                                                <Button className="flex-1 max-w-32"
                                                    variant="accent"
                                                    onClick={() => { router.push(`/admin/buses/types/edit/${busType.id}`) }}
                                                >
                                                    Edit
                                                </Button>
                                                <Button className="flex-1 max-w-32"
                                                    variant="danger"
                                                    onClick={(_) => {
                                                        setShowDeleteModal(true);
                                                        setDeletingBusType(busType);
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
                    <Pagination currentPage={busTypePage} totalPage={busTypeTotalPage} loadPageFn={(newPage) => {
                        setBusTypePage(newPage);
                    }} />
                </div>
            )}

            <Modal open={showDeleteModal} onClose={() => onDeleteModalClose()}>
                <Card onClick={(e) => e.stopPropagation()} className="max-w-lg min-w-lg">
                    <CardHeader>
                        <h1 className="text-text dark:text-text font-bold text-xl">
                            Are you sure you want to delete this bus type?
                        </h1>
                        {deleteBusTypeError && (
                            <div className="text-danger dark:text-danger font-bold mt-4">{deleteBusTypeError}</div>
                        )}
                    </CardHeader>
                    <CardBody className="text-text dark:text-text">
                        <div>ID: {deletingBusType?.id}</div>
                        <div>Name: {deletingBusType?.name}</div>
                        <div>Price Multiplier: {deletingBusType?.priceMultiplier}</div>
                    </CardBody>
                    <CardFooter className="flex justify-between gap-6">
                        <Button variant="danger"
                            className="flex-1"
                            disabled={deleteBusTypeMutation.isPending}
                            onClick={() => {
                                if (deletingBusType) {
                                    deleteBusTypeMutation.mutate({ id: deletingBusType.id });
                                }
                            }}>
                            {deleteBusTypeMutation.isPending ? "Deleting..." : "Confirm"}
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