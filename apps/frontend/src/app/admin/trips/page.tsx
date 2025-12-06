"use client"

import { Button } from "@/src/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/src/components/ui/card";
import Checkbox from "@/src/components/ui/checkbox";
import { FormField } from "@/src/components/ui/form-field";
import Modal from "@/src/components/ui/modal";
import Pagination from "@/src/components/ui/pagination";
import { OptionType, SelectDropdown } from "@/src/components/ui/select-dropdown";
import { Table } from "@/src/components/ui/table";
import { useTRPC } from "@/src/utils/trpc";
import { TripAdminSearchDtoType } from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RouterOutputsType } from "backend";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import RangeSlider from 'react-range-slider-input';
import 'react-range-slider-input/dist/style.css';
import "./slider.css";

type Station = RouterOutputsType['stations']['search']['data'][number];
type Trip = RouterOutputsType['trips']['adminSearch']['data'][number];

export default function AdminManageTripPage() {
    const router = useRouter();
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const perPage = 20;


    // fetching bus types for filter options
    const busTypesQueryOpts = trpc.busTypes.search.queryOptions({ perPage: 999 });
    const busTypesQuery = useQuery({
        ...busTypesQueryOpts,
        staleTime: 5 * 60 * 1000,
    });

    // fetching stations for dropdown
    const [stations, setStations] = useState<Station[]>([]);
    const stationTotalPageNumber = useRef(1);
    const [stationPage, setStationPage] = useState(1);

    const searchStationQueryOpts = trpc.stations.search.queryOptions({
        page: stationPage,
        perPage,
    });
    const searchStationQuery = useQuery({
        ...searchStationQueryOpts,
        staleTime: 60 * 60 * 1000,
    });
    // appending stations whenever successfully fetch
    useEffect(() => {
        if (searchStationQuery.isSuccess) {
            stationTotalPageNumber.current = searchStationQuery.data.totalPage;
            setStations([...stations, ...searchStationQuery.data.data]);
        }
    }, [searchStationQuery.isSuccess]);


    // actually search for trip here
    const [tripPage, setTripPage] = useState(1);
    const [tripTotalPage, setTripTotalPage] = useState(1);
    const [tripSearchQueryInput, setTripSearchQueryInput] = useState<TripAdminSearchDtoType>({
        page: tripPage,
        perPage,
        minPrice: 0,
        maxPrice: 1000000,
    });
    // the actual state used in query
    const [tripSearchQueryObj, setTripSearchQueryObj] = useState<TripAdminSearchDtoType>(tripSearchQueryInput);
    const tripSearchQueryOpts = trpc.trips.adminSearch.queryOptions(tripSearchQueryObj);
    const tripSearchQuery = useQuery({
        ...tripSearchQueryOpts,
        staleTime: 60 * 60 * 1000,
    });

    useEffect(() => {
        if (tripSearchQuery.isSuccess) {
            if (tripSearchQuery.data.totalPage !== tripTotalPage) {
                setTripTotalPage(tripSearchQuery.data.totalPage);
                setTripPage(1);
            }
        }
    }, [tripSearchQuery.isFetching]);

    const [minPriceInput, setMinPriceInput] = useState(tripSearchQueryInput.minPrice ?? 0);
    const [maxPriceInput, setMaxPriceInput] = useState(tripSearchQueryInput.maxPrice ?? 0);


    // deleting trip
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingTrip, setDeletingTrip] = useState<Trip | null>(null);
    const [deleteTripError, setDeleteTripError] = useState<string>();
    const deleteTripOpts = trpc.trips.deleteOne.mutationOptions();
    const deleteRouteMutation = useMutation({
        ...deleteTripOpts,
        onError(error) {
            setDeleteTripError(error.message);
        },
        onSuccess(_, variables) {
            onDeleteModalClose();
            queryClient.removeQueries({ queryKey: trpc.trips.findOneById.queryKey({ id: variables.id }) });
            queryClient.invalidateQueries({ queryKey: trpc.trips.search.queryKey() });
            queryClient.invalidateQueries({ queryKey: trpc.trips.adminSearch.queryKey() });
        },
    });

    const onDeleteModalClose = () => {
        setShowDeleteModal(false);
        setDeletingTrip(null);
        setDeleteTripError(undefined);
    };

    return (
        <div className="flex flex-col">
            <h1 className="text-[32px] text-text dark:text-text font-bold mb-8">Manage Trips</h1>
            <Button variant="accent" className="self-start mb-8" onClick={() => router.push('/admin/trips/new')}>CREATE NEW TRIP</Button>

            {/* Sort and Filter */}
            <form>
                <Card className="flex flex-col mb-8">
                    <CardHeader className="text-text dark:text-text text-[20px] font-bold">FILTER</CardHeader>
                    <CardBody className="flex px-6 border-border dark:border-border pb-4 gap-8">
                        <div className="flex flex-col gap-2 flex-1">
                            <span className="text-text dark:text-text font-bold text-[1rem]">Bus Type</span>
                            {busTypesQuery.isPending ? (
                                <div className="text-text dark:text-text">
                                    Loading...
                                </div>
                            ) : (
                                <>
                                    {busTypesQuery.data?.data.map(busType => (
                                        <Checkbox title={busType.name}
                                            id={busType.id} name={`filter-${busType.name}-bus`} key={busType.id}
                                            onChange={(e) => {
                                                const { checked } = e.currentTarget;
                                                const value = busType.id;

                                                setTripSearchQueryInput(prev => {
                                                    const old = prev.busTypeIds ?? [];
                                                    const newBusTypeIds = checked
                                                        ? [...old, value]
                                                        : old.filter(v => v !== value);

                                                    return {
                                                        ...prev,
                                                        busTypeIds: newBusTypeIds,
                                                    };
                                                });
                                            }}
                                        />
                                    ))}
                                </>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 flex-1">
                            <span className="text-text dark:text-text font-bold text-[1rem]">Departure Time</span>
                            {[
                                { value: "early", label: "Early", time: "06:00-11:00" },
                                { value: "midday", label: "Midday", time: "11:00-17:00" },
                                { value: "late", label: "Late", time: "17:00-00:00" },
                                { value: "midnight", label: "Midnight", time: "00:00-06:00" },
                            ].map((opt) => (
                                <div className="flex justify-between" key={opt.value}>
                                    <Checkbox title={opt.label}
                                        id={`filter-${opt.value}-departure-time`}
                                        name={`filter-${opt.value}-departure-time`}
                                        onChange={(e) => {
                                            const { checked } = e.currentTarget;

                                            setTripSearchQueryInput(prev => {
                                                const old = prev.depatureTimeRange ?? [];
                                                const newRange = checked
                                                    ? [...old, opt.value]
                                                    : old.filter(v => v !== opt.value);

                                                return {
                                                    ...prev,
                                                    depatureTimeRange: newRange as ("early" | "midday" | "late" | "midnight")[] | undefined
                                                };
                                            });
                                        }}
                                    />

                                    <label
                                        htmlFor={`filter-${opt.value}-departure-time`}
                                        className="text-secondary-text dark:text-secondary-text"
                                    >
                                        {opt.time}
                                    </label>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-2 flex-1">
                            <span className="text-text dark:text-text font-bold text-[1rem]">Departure Time</span>
                            <RangeSlider
                                className="mt-2 mb-4"
                                id="price-range-input"
                                min={0}
                                max={1000000}
                                step={1000}
                                value={[tripSearchQueryInput.minPrice ?? 0, tripSearchQueryInput.maxPrice ?? 1000000]}
                                onInput={(e) => {
                                    const number1 = e[0];
                                    const number2 = e[1];
                                    setTripSearchQueryInput({
                                        ...tripSearchQueryInput,
                                        minPrice: Math.min(number1, number2),
                                        maxPrice: Math.max(number1, number2),
                                    });
                                    setMinPriceInput(Math.min(number1, number2));
                                    setMaxPriceInput(Math.max(number1, number2));
                                }}
                            />
                            <div className="flex gap-3">
                                <FormField
                                    value={minPriceInput}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (isNaN(val))
                                            return;
                                        setMinPriceInput(val);
                                    }}
                                    onBlur={() => {
                                        let maxPrice = tripSearchQueryInput.maxPrice ?? 0;
                                        const newMinPrice = Math.max(Math.min(minPriceInput, maxPrice), 0);
                                        const newMaxPrice = Math.min(Math.max(minPriceInput, maxPrice), 1000000);
                                        setTripSearchQueryInput({
                                            ...tripSearchQueryInput,
                                            minPrice: newMinPrice,
                                            maxPrice: newMaxPrice,
                                        });
                                        setMinPriceInput(newMinPrice);
                                        newMaxPrice !== maxPriceInput && setMaxPriceInput(newMaxPrice);
                                    }}
                                />
                                <FormField
                                    value={maxPriceInput}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (isNaN(val))
                                            return;
                                        setMaxPriceInput(val);
                                    }}
                                    onBlur={() => {
                                        let minPrice = tripSearchQueryInput.minPrice ?? 0;
                                        const newMinPrice = Math.max(Math.min(maxPriceInput, minPrice), 0);
                                        const newMaxPrice = Math.min(Math.max(maxPriceInput, minPrice), 1000000);
                                        setTripSearchQueryInput({
                                            ...tripSearchQueryInput,
                                            minPrice: newMinPrice,
                                            maxPrice: newMaxPrice,
                                        });
                                        newMinPrice !== minPriceInput && setMinPriceInput(newMinPrice);
                                        setMaxPriceInput(newMaxPrice);
                                    }}
                                />
                            </div>
                        </div>
                    </CardBody>

                    <CardBody className="flex px-6 border-b border-border dark:border-border pb-4 gap-8">
                        <div className="flex-1">
                            <SelectDropdown label="Origin" isClearable
                                options={stations.map(station => ({ value: station.id, label: station.name }))}
                                onChange={(newValue, _) => {
                                    const newVal: OptionType<string> = newValue as OptionType<string>;
                                    setTripSearchQueryInput({
                                        ...tripSearchQueryInput,
                                        originId: newVal?.value,
                                    });
                                }}
                                onMenuScrollToBottom={(_) => {
                                    if (stationPage < stationTotalPageNumber.current) {
                                        setStationPage(stationPage + 1);
                                    }
                                }}
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                            />
                        </div>
                        <div className="flex-1">
                            <SelectDropdown label="Destination" isClearable
                                options={stations.map(station => ({ value: station.id, label: station.name }))}
                                onChange={(newValue, _) => {
                                    const newVal: OptionType<string> = newValue as OptionType<string>;
                                    setTripSearchQueryInput({
                                        ...tripSearchQueryInput,
                                        destinationId: newVal?.value,
                                    });
                                }}
                                onMenuScrollToBottom={(_) => {
                                    if (stationPage < stationTotalPageNumber.current) {
                                        setStationPage(stationPage + 1);
                                    }
                                }}
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                            />
                        </div>
                    </CardBody>

                    <CardHeader className="text-text dark:text-text text-[20px] font-bold">SORT</CardHeader>
                    <div className="flex px-6 border-b border-border dark:border-border pb-4 gap-8">
                        <div className="flex-1">
                            <SelectDropdown label="Departure Time" id="sort-departure-time" name="sort-departure-time" isClearable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                options={[
                                    { value: "asc", label: "Ascending" },
                                    { value: "desc", label: "Descending" },
                                ]}
                                onChange={(newValue) => {
                                    const newVal: OptionType<string> = newValue as OptionType<string>;
                                    setTripSearchQueryInput({
                                        ...tripSearchQueryInput,
                                        sortDepartureTime: newVal ? newVal.value as "asc" | "desc" : undefined,
                                    });
                                }}
                            />
                        </div>
                        <div className="flex-1">
                            <SelectDropdown label="Price" id="sort-price" name="sort-price" isClearable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                options={[
                                    { value: "asc", label: "Ascending" },
                                    { value: "desc", label: "Descending" },
                                ]}
                                onChange={(newValue) => {
                                    const newVal: OptionType<string> = newValue as OptionType<string>;
                                    setTripSearchQueryInput({
                                        ...tripSearchQueryInput,
                                        sortPrice: newVal ? newVal.value as "asc" | "desc" : undefined,
                                    });
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
                            setTripSearchQueryObj(tripSearchQueryInput);
                            tripSearchQuery.refetch();
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
                        Search Trips
                    </Button>
                </Card>
            </form>

            {/* table here baby */}
            {tripSearchQuery.isFetching ? (
                <div className="text-text dark:text-text flex justify-center font-bold">Loading...</div>
            ) : (
                <>
                    {tripSearchQuery.isSuccess ? (
                        <>
                            {tripSearchQuery.data.total > 0 ? (
                                <Card className="flex overflow-hidden">
                                    <Table
                                        data={tripSearchQuery.data.data}
                                        rowKey={(trip) => `trip-${trip.id}`}
                                        columns={[
                                            {
                                                header: "Origin",
                                                render: trip => trip.route.origin.name,
                                            },
                                            {
                                                header: "Destination",
                                                render: trip => trip.route.destination.name,
                                            },
                                            {
                                                header: "Bus Number",
                                                render: trip => trip.bus.plateNumber,
                                            },
                                            {
                                                header: "Departure Time",
                                                render: trip => {
                                                    const date = new Date(trip.departureTime);
                                                    const dateString = date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
                                                    const timeString = date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
                                                    return `${dateString}, ${timeString}`;
                                                },
                                            },
                                            {
                                                header: "Price",
                                                render: trip => {
                                                    const price = Math.ceil(trip.basePrice);
                                                    return new Intl.NumberFormat("de-DE", {
                                                        style: "currency", currency: "VND", currencyDisplay: "code"
                                                    }).format(price);
                                                },
                                            },
                                            {
                                                header: "Actions",
                                                render: trip => (
                                                    <>
                                                        <Button className="flex-1 max-w-32"
                                                            variant="accent"
                                                            onClick={() => { router.push(`/admin/trips/edit/${trip.id}`) }}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button className="flex-1 max-w-32"
                                                            variant="danger"
                                                            onClick={() => {
                                                                setShowDeleteModal(true);
                                                                setDeletingTrip(trip);
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
                                <div className="text-text dark:text-text font-bold text-base text-center">No Data</div>
                            )}
                        </>
                    ) : (
                        <div className="text-danger dark:text-danger font-bold text-base text-center">ERROR LOADING TRIP</div>
                    )}
                </>
            )}
            {!tripSearchQuery.isError && (
                <div className="mt-8 flex justify-center">
                    <Pagination currentPage={tripPage} totalPage={tripTotalPage} loadPageFn={(newPage) => {
                        setTripPage(newPage);
                    }} />
                </div>
            )}

            <Modal open={showDeleteModal} onClose={() => onDeleteModalClose()}>
                <Card onClick={(e) => e.stopPropagation()} className="max-w-lg min-w-lg">
                    <CardHeader>
                        <h1 className="text-text dark:text-text font-bold text-xl">
                            Are you sure you want to delete this route?
                        </h1>
                        {deleteTripError && (
                            <div className="text-danger dark:text-danger font-bold mt-4">{deleteTripError}</div>
                        )}
                    </CardHeader>
                    <CardBody className="text-text dark:text-text">
                        <div>ID: {deletingTrip?.id}</div>
                        <div>Route: {deletingTrip?.route.origin.name} - {deletingTrip?.route.destination.name} - {deletingTrip?.route.distanceKm} (km)</div>
                        <div>Driver: {deletingTrip?.bus.driver.name} - {deletingTrip?.bus.driver.email} - {deletingTrip?.bus.driver.phone}</div>
                    </CardBody>
                    <CardFooter className="flex justify-between gap-6">
                        <Button variant="danger"
                            className="flex-1"
                            disabled={deleteRouteMutation.isPending}
                            onClick={() => {
                                if (deletingTrip) {
                                    deleteRouteMutation.mutate({ id: deletingTrip.id });
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