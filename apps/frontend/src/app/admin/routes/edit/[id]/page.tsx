"use client";

import { Button } from "@/src/components/ui/button";
import { Card, CardBody, CardFooter } from "@/src/components/ui/card";
import { FormField } from "@/src/components/ui/form-field";
import { OptionType, SelectDropdown } from "@/src/components/ui/select-dropdown";
import { useTRPC } from "@/src/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, useEffect } from "react";
import { type RouterOutputsType } from 'backend'
import { useForm, Controller } from "react-hook-form";
import { RouteUpdateOneDto, RouteUpdateOneDtoType } from "@repo/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import NotFoundPage from "@/src/components/status-pages/not-found-page";

// bro what the hell
type Station = RouterOutputsType["stations"]["search"]['data'][number];

export default function AdminEditRoutePage() {
    const params = useParams<{ id: string }>();
    const trpc = useTRPC();
    const router = useRouter();
    const queryClient = useQueryClient();

    const routeQueryOpts = trpc.routes.findOneById.queryOptions({
        id: params.id,
    });
    const routeQuery = useQuery({
        ...routeQueryOpts,
        staleTime: 60 * 60 * 1000,
    });
    const [originStation, setOriginStation] = useState<Station>();
    const [destinationStation, setDestinationStation] = useState<Station>();

    // fetching stations for dropdown
    const perPage = 20;

    const stationTotalPageNumber = useRef(1);
    const [stationPage, setStationPage] = useState(1);
    const [stations, setStations] = useState<Station[]>([]);

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

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors: formErrors, isValid },
        setError,
    } = useForm<RouteUpdateOneDtoType>({
        resolver: zodResolver(RouteUpdateOneDto),
        mode: "all",
    });

    useEffect(() => {
        if (routeQuery.isSuccess && routeQuery.data) {
            const data = routeQuery.data;
            setOriginStation(data.origin);
            setDestinationStation(data.destination);
            reset({
                id: params.id,
                originId: data.origin.id,
                destinationId: data.destination.id,
                distanceKm: data.distanceKm,
                estimatedMinutes: data.estimatedMinutes,
            });
        }
    }, [routeQuery.isSuccess]);

    const updateRouteMutationOpts = trpc.routes.updateOne.mutationOptions();
    const updateRouteMutation = useMutation({
        ...updateRouteMutationOpts,
        onError(error: any) {
            if (error.data?.zodError) {
                const zodErrors = error.data.zodError.fieldErrors;
                zodErrors.forEach((fieldError: any) => {
                    setError(fieldError.path[0] as any, {
                        message: fieldError.message,
                    });
                });
            } else {
                setError("root", {
                    message: error.message || "Updating route failed Please try again.",
                });
            }
        },
        onSuccess(data) {
            queryClient.invalidateQueries({ queryKey: trpc.routes.search.queryKey() });
            queryClient.setQueryData(trpc.routes.findOneById.queryKey({ id: data.id }), data);
            setTimeout(() => router.push('/admin/routes'), 3000);
        },
    });

    const onSubmit = (data: RouteUpdateOneDtoType) => {
        updateRouteMutation.mutate(data);
    }

    if (!routeQuery.isPending && !routeQuery.data) {
        return (
            <NotFoundPage
                header='Route Not Found'
                message="The route you're looking for doesn't exist or has been removed."
                returnBtnText="Go back"
                redirectUrl="/admin/routes"
                routerGoBack
            />
        );
    }

    return (
        <div className="flex flex-col">
            <h1 className="text-[2rem] text-text dark:text-text font-bold mb-8">Edit Route</h1>
            <Button variant="accent" className="self-start mb-8" onClick={() => router.push('/admin/routes')}>Return</Button>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardBody className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {formErrors.root && (
                            <div className="col-span-2">
                                <p className="text-danger dark:text-danger font-bold">{formErrors.root.message}</p>
                            </div>
                        )}

                        {/* station dropdowns */}
                        <Controller control={control}
                            name="originId"
                            render={({ field: { onChange } }) => (
                                <SelectDropdown label="Origin" isClearable required
                                    options={stations.map(station => ({ value: station.id, label: station.name }))}
                                    value={originStation && { value: originStation.id, label: originStation.name }}
                                    onChange={(newValue, _) => {
                                        const newVal: OptionType<string> = newValue as OptionType<string>;
                                        setOriginStation(newVal ? { id: newVal.value, name: newVal.label } : undefined);
                                        onChange(newVal ? newVal.value : "");
                                    }}
                                    errorMessage={formErrors.originId?.message}
                                    onMenuScrollToBottom={(_) => {
                                        if (stationPage < stationTotalPageNumber.current) {
                                            setStationPage(stationPage + 1);
                                        }
                                    }}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                />
                            )}
                        />
                        <Controller control={control}
                            name="destinationId"
                            render={({ field: { onChange } }) => (
                                <SelectDropdown label="Destination" isClearable required
                                    options={stations.map(station => ({ value: station.id, label: station.name }))}
                                    value={destinationStation && { value: destinationStation.id, label: destinationStation.name }}
                                    onChange={(newValue, _) => {
                                        const newVal: OptionType<string> = newValue as OptionType<string>;
                                        setDestinationStation(newVal ? { id: newVal.value, name: newVal.label } : undefined);
                                        onChange(newVal ? newVal.value : "");
                                    }}
                                    errorMessage={formErrors.destinationId?.message}
                                    onMenuScrollToBottom={(_) => {
                                        if (stationPage < stationTotalPageNumber.current) {
                                            setStationPage(stationPage + 1);
                                        }
                                    }}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                />
                            )}
                        />
                        <FormField
                            label="Distance (km)"
                            placeholder="100"
                            required
                            {...register("distanceKm", { valueAsNumber: true })}
                            error={formErrors.distanceKm?.message}
                        />
                        <FormField
                            label="Estimated Minutes"
                            placeholder="100"
                            required
                            {...register("estimatedMinutes", { valueAsNumber: true })}
                            error={formErrors.estimatedMinutes?.message}
                        />
                    </CardBody>

                    <CardFooter>
                        <Button
                            type="submit"
                            variant="accent"
                            size="md"
                            fullWidth
                            disabled={!isValid || updateRouteMutation.isPending || updateRouteMutation.isSuccess}
                        >
                            {updateRouteMutation.isPending ? "Updating..." : "Update"}
                        </Button>

                        {updateRouteMutation.isSuccess && (
                            <>
                                <div className="col-span-2 text-success dark:text-success font-bold text-center text-xl mt-4">Update Route Successfully!</div>
                                <div className="col-span-2 text-success dark:text-success font-bold text-center text-xl mt-4">Returning to Routes Page</div>
                            </>
                        )}
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
};