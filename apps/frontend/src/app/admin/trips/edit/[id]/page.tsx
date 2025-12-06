"use client";;
import { Button } from "@/src/components/ui/button";
import { Card, CardBody, CardFooter } from "@/src/components/ui/card";
import { FormField } from "@/src/components/ui/form-field";
import { OptionType, SelectDropdown } from "@/src/components/ui/select-dropdown";
import { useTRPC } from "@/src/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { TripCreateOneDto, TripCreateOneDtoType, TripUpdateOneDto, TripUpdateOneDtoType } from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RouterOutputsType } from "backend";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";

type Route = RouterOutputsType['routes']['search']['data'][number];
type Bus = RouterOutputsType['buses']['searchBus']['data'][number];
type Trip = RouterOutputsType['trips']['findOneById'];

export default function AdminEditTripPage() {
    const router = useRouter();
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const params = useParams<{ id: string }>();
    const perPage = 20;

    // fetch trip and necessary infos for updating here baby
    const tripQueryOpts = trpc.trips.findOneById.queryOptions({ id: params.id });
    const tripQuery = useQuery({
        ...tripQueryOpts,
        staleTime: 60 * 60 * 1000,
    });
    const [selectedRoute, setSelectedRoute] = useState<Route>();
    const [selectedBus, setSelectedBus] = useState<Bus>();

    // fetching bus for dropdown
    const [buses, setBuses] = useState<Bus[]>([]);
    const busTotalPageNumber = useRef(1);
    const [busPage, setBusPage] = useState(1);

    const searchBusQueryOpts = trpc.buses.searchBus.queryOptions({
        page: busPage,
        perPage,
        driverNotNull: true,
    });
    const searchBusQuery = useQuery({
        ...searchBusQueryOpts,
        staleTime: 60 * 60 * 1000,
    });
    // appending buses whenever successfully fetch
    useEffect(() => {
        if (searchBusQuery.isSuccess) {
            busTotalPageNumber.current = searchBusQuery.data.totalPage;
            setBuses([...buses, ...searchBusQuery.data.data]);
        }
    }, [searchBusQuery.isSuccess]);


    // fetching routes for dropdown
    const [routes, setRoutes] = useState<Route[]>([]);
    const routeTotalPageNumber = useRef(1);
    const [routePage, setRoutePage] = useState(1);

    const searchRouteQueryOpts = trpc.routes.search.queryOptions({
        page: routePage,
        perPage,
    });
    const searchRouteQuery = useQuery({
        ...searchRouteQueryOpts,
        staleTime: 60 * 60 * 1000,
    });
    // appending routes whenever successfully fetch
    useEffect(() => {
        if (searchRouteQuery.isSuccess) {
            routeTotalPageNumber.current = searchRouteQuery.data.totalPage;
            setRoutes([...routes, ...searchRouteQuery.data.data]);
        }
    }, [searchRouteQuery.isSuccess]);


    // update trip mutation here baby
    const {
        register,
        handleSubmit,
        control,
        formState: { errors: formErrors, isValid },
        reset,
        setError,
    } = useForm<TripUpdateOneDtoType>({
        resolver: zodResolver(TripUpdateOneDto)
    });

    useEffect(() => {
        const formatDateTimeLocal = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        if (tripQuery.isSuccess && tripQuery.data) {
            const data = tripQuery.data;
            setSelectedRoute(data.route);
            setSelectedBus(data.bus);
            reset({
                id: params.id,
                routeId: data.route.id,
                busId: data.bus.id,
                // is this dirty cheap hack
                departureTime: formatDateTimeLocal(new Date(data.departureTime)) as any,
                arrivalTime: formatDateTimeLocal(new Date(data.arrivalTime)) as any,
                basePrice: data.basePrice,
            });
        }
    }, [tripQuery.isSuccess]);

    const updateTripMutationOpts = trpc.trips.updateOne.mutationOptions();
    const updateTripMutation = useMutation({
        ...updateTripMutationOpts,
        onError(error: any) {
            if (error.data?.zodError) {
                // Handle Zod validation errors from backend
                const zodErrors = error.data.zodError.fieldErrors;
                zodErrors.forEach((fieldError: any) => {
                    setError(fieldError.path[0] as any, {
                        message: fieldError.message,
                    });
                });
            } else {
                setError("root", {
                    message: error.message || "Updating trip failed. Please try again.",
                });
            }
        },
        onSuccess(data) {
            queryClient.invalidateQueries({ queryKey: trpc.trips.search.queryKey() });
            queryClient.invalidateQueries({ queryKey: trpc.trips.adminSearch.queryKey() });
            queryClient.setQueryData(trpc.trips.findOneById.queryKey({ id: data.id }), data);
            setTimeout(() => router.push('/admin/trips'), 3000);
        },
    });

    const onSubmit = (data: TripUpdateOneDtoType) => {
        updateTripMutation.mutate(data);
    }

    return (
        <div className="flex flex-col">
            <h1 className="text-[32px] text-text dark:text-text font-bold mb-8">Edit Trip</h1>
            <Button variant="accent" className="self-start mb-8" onClick={() => router.push('/admin/trips')}>Return</Button>

            {/* Sort and Filter */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <Card className="flex flex-col mb-8">
                    <CardBody className="flex flex-col px-6 pb-4 gap-8">
                        {formErrors.root && (
                            <div className="col-span-2">
                                <p className="text-danger dark:text-danger font-bold">{formErrors.root.message}</p>
                            </div>
                        )}

                        <div className="flex-1">
                            <Controller control={control}
                                name="routeId"
                                render={({ field: { onChange } }) => (
                                    <SelectDropdown label="Route (Origin - Destination - Distance - Estimated Minutes)" isClearable required
                                        value={selectedRoute && function () {
                                            const hours = Math.floor(selectedRoute.estimatedMinutes / 60);
                                            const minutes = selectedRoute.estimatedMinutes % 60;
                                            return {
                                                value: selectedRoute.id,
                                                label: `${selectedRoute.origin.name} - ${selectedRoute.destination.name} - ${selectedRoute.distanceKm} km - ${hours && `${hours} hour${hours > 1 && "s"}, `} ${minutes && `${minutes} minute${minutes > 1 && "s"}`}`,
                                            }
                                        }()}
                                        options={routes.map(route => {
                                            const hours = Math.floor(route.estimatedMinutes / 60);
                                            const minutes = route.estimatedMinutes % 60;
                                            return {
                                                value: route.id,
                                                label: `${route.origin.name} - ${route.destination.name} - ${route.distanceKm} km - ${hours && `${hours} hour${hours > 1 && "s"}, `} ${minutes && `${minutes} minute${minutes > 1 && "s"}`}`,
                                            }
                                        })}
                                        onChange={(newValue, _) => {
                                            const newVal: OptionType<string> = newValue as OptionType<string>;
                                            onChange(newVal ? newVal.value : "");
                                            setSelectedRoute(newVal ? routes.find(r => r.id === newVal.value)! : undefined);
                                        }}
                                        errorMessage={formErrors.routeId?.message}
                                        onMenuScrollToBottom={(_) => {
                                            if (routePage < routeTotalPageNumber.current) {
                                                setRoutePage(routePage + 1);
                                            }
                                        }}
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                    />
                                )}
                            />
                        </div>
                    </CardBody>
                    <CardBody className="flex px-6 pb-4 gap-8">
                        <div className="flex-1">
                            <FormField label="Depature Time"
                                required
                                type="datetime-local"
                                {...register("departureTime", { valueAsDate: true })}
                                error={formErrors.departureTime?.message}
                            />
                        </div>
                        <div className="flex-1">
                            <FormField label="Arrival Time"
                                required
                                type="datetime-local"
                                {...register("arrivalTime", { valueAsDate: true })}
                                error={formErrors.arrivalTime?.message}
                            />
                        </div>
                    </CardBody>
                    <CardBody className="flex px-6 pb-4 gap-8">
                        <div className="flex-1">
                            <Controller control={control}
                                name="busId"
                                render={({ field: { onChange } }) => (
                                    <SelectDropdown label="Bus (Plate Number - Type - Type Price Multi - Driver Name - Driver Email)" isClearable required
                                        value={selectedBus && function () {
                                            return { value: selectedBus.id, label: `${selectedBus.plateNumber} - ${selectedBus.type.name} - ${selectedBus.driver.name} - ${selectedBus.driver.email}` };
                                        }()}
                                        options={buses.map(bus => ({ value: bus.id, label: `${bus.plateNumber} - ${bus.type.name} - ${bus.driver.name} - ${bus.driver.email}` }))}
                                        onChange={(newValue, _) => {
                                            const newVal: OptionType<string> = newValue as OptionType<string>;
                                            onChange(newVal ? newVal.value : "");
                                            setSelectedBus(newVal ? buses.find(b => b.id === newVal.value)! : undefined);
                                        }}
                                        errorMessage={formErrors.busId?.message}
                                        onMenuScrollToBottom={(_) => {
                                            if (busPage < busTotalPageNumber.current) {
                                                setBusPage(busPage + 1);
                                            }
                                        }}
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                    />
                                )}
                            />
                        </div>
                    </CardBody>
                    <CardBody className="flex px-6 pb-4 gap-8">
                        <div className="flex-1">
                            <FormField label="Price"
                                required
                                placeholder="290000"
                                {...register("basePrice", { valueAsNumber: true })}
                                error={formErrors.basePrice?.message}
                            />
                        </div>
                    </CardBody>

                    <CardFooter>
                        <Button
                            type="submit"
                            variant="accent"
                            fullWidth
                            disabled={!isValid || updateTripMutation.isPending || updateTripMutation.isSuccess}
                        >
                            {updateTripMutation.isPending ? "Updating..." : "Update"}
                        </Button>

                        {updateTripMutation.isSuccess && (
                            <>
                                <div className="col-span-2 text-success dark:text-success font-bold text-center text-xl mt-4">Update Trip Successfully!</div>
                                <div className="col-span-2 text-success dark:text-success font-bold text-center text-xl mt-4">Returning to Trip Page</div>
                            </>
                        )}
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}