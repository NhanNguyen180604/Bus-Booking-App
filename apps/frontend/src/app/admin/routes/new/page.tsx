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
import { RouteCreateOneDto, RouteCreateOneDtoType } from "@repo/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

// bro what the hell
type Station = RouterOutputsType["stations"]["search"]['data'][number];

export default function AdminCreateNewRoutePage() {
    const trpc = useTRPC();
    const router = useRouter();
    const queryClient = useQueryClient();

    const perPage = 20;

    // fetching stations for dropdown
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
        control,
        formState: { errors: formErrors, isValid },
        setError,
    } = useForm<RouteCreateOneDtoType>({
        resolver: zodResolver(RouteCreateOneDto),
        mode: "all",
    });

    const createRouteMutationOpts = trpc.routes.createOne.mutationOptions();
    const createRouteMutation = useMutation({
        ...createRouteMutationOpts,
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
                    message: error.message || "Create new route failed. Please try again.",
                });
            }
        },
        onSuccess(data) {
            queryClient.invalidateQueries({ queryKey: trpc.routes.search.queryKey() });
            queryClient.setQueryData(trpc.routes.findOneById.queryKey({ id: data.id }), data);
            setTimeout(() => router.push('/admin/routes'), 3000);
        },
    });

    const onSubmit = (data: RouteCreateOneDtoType) => {
        createRouteMutation.mutate(data);
    }

    return (
        <div className="flex flex-col">
            <h1 className="text-[2rem] text-text dark:text-text font-bold mb-8">Create New Route</h1>
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
                                    onChange={(newValue, _) => {
                                        const newVal: OptionType<string> = newValue as OptionType<string>;
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
                                    onChange={(newValue, _) => {
                                        const newVal: OptionType<string> = newValue as OptionType<string>;
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
                            disabled={!isValid || createRouteMutation.isPending || createRouteMutation.isSuccess}
                        >
                            {createRouteMutation.isPending ? "Creating..." : "Create"}
                        </Button>

                        {createRouteMutation.isSuccess && (
                            <>
                                <div className="col-span-2 text-success dark:text-success font-bold text-center text-xl mt-4">Create Route Successfully!</div>
                                <div className="col-span-2 text-success dark:text-success font-bold text-center text-xl mt-4">Returning to Routes Page</div>
                            </>
                        )}
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
};