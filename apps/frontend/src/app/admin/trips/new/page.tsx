"use client";;
import { CancelIcon } from "@/src/components/icons/cancel-ic";
import { CheckIcon } from "@/src/components/icons/check-ic";
import { Button } from "@/src/components/ui/button";
import { Card, CardBody, CardFooter } from "@/src/components/ui/card";
import { FormField } from "@/src/components/ui/form-field";
import Loading from "@/src/components/ui/loading";
import { OptionType, SelectDropdown } from "@/src/components/ui/select-dropdown";
import { useTRPC } from "@/src/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { TripCreateOneDto, TripCreateOneDtoType } from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RouterOutputsType } from "backend";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";

type Bus = RouterOutputsType['buses']['searchBus']['data'][number];

export default function AdminCreateTripPage() {
    const router = useRouter();
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const busesQuery = useQuery({
        ...trpc.buses.findAll.queryOptions(),
        staleTime: 60 * 60 * 1000,
    });

    // fetching routes for dropdown
    const routesQuery = useQuery({
        ...trpc.routes.findAll.queryOptions(),
        staleTime: 60 * 60 * 1000,
    });

    // create trip mutation here baby
    const {
        register,
        handleSubmit,
        control,
        formState: { errors: formErrors, isValid },
        setError,
    } = useForm<TripCreateOneDtoType>({
        resolver: zodResolver(TripCreateOneDto)
    });

    const createTripMutationOpts = trpc.trips.createOne.mutationOptions();
    const createTripMutation = useMutation({
        ...createTripMutationOpts,
        onError(error) {
            setError("root", { message: error.message })
        },
        onSuccess(data) {
            queryClient.invalidateQueries({ queryKey: trpc.trips.search.queryKey() });
            queryClient.invalidateQueries({ queryKey: trpc.trips.adminSearch.queryKey() });
            queryClient.setQueryData(trpc.trips.findOneById.queryKey({ id: data.id }), data);
            router.push('/admin/trips');
        },
    });

    const onSubmit = (data: TripCreateOneDtoType) => {
        createTripMutation.mutate(data);
    }

    if (routesQuery.isPending || busesQuery.isPending) {
        return <Loading />
    }

    const routesData = routesQuery.data || [];
    const busesData = busesQuery.data || [];

    return (
        <div className="flex flex-col">
            <h1 className="text-[32px] text-text dark:text-text font-bold mb-8">Create New Trip</h1>
            <Button variant="accent" className="self-start mb-8" onClick={() => router.push('/admin/trips')}>Return</Button>

            {/* Sort and Filter */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <Card className="flex flex-col mb-8">
                    <CardBody className="flex flex-col px-6 pb-4 gap-8">
                        {formErrors.root && (
                            <div className="
                                text-danger dark:text-danger bg-danger/20 dark:bg-danger/20 
                                border border-danger dark:border-danger
                                font-bold mt-4 p-4 rounded-lg flex gap-4
                            ">
                                <CancelIcon /> <span>{formErrors.root.message}</span>
                            </div>
                        )}

                        <div className="flex-1">
                            <Controller control={control}
                                name="routeId"
                                render={({ field }) => (
                                    <SelectDropdown label="Route (Origin - Destination - Distance - Estimated Minutes)" isClearable required
                                        options={routesData.map(route => {
                                            const hours = Math.floor(route.estimatedMinutes / 60);
                                            const minutes = route.estimatedMinutes % 60;
                                            return {
                                                value: route.id,
                                                label: `${route.origin.name} - ${route.destination.name} - ${route.distanceKm} km - ${hours && `${hours} hour${hours > 1 && "s"}, `} ${minutes && `${minutes} minute${minutes > 1 && "s"}`}`,
                                            }
                                        })}
                                        onChange={(newValue, _) => {
                                            const newVal: OptionType<string> = newValue as OptionType<string>;
                                            field.onChange(newVal ? newVal.value : "");
                                        }}
                                        errorMessage={formErrors.routeId?.message}
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
                                    <SelectDropdown label="Bus (Plate Number - Type - Driver Name - Driver Email)" isClearable required
                                        options={busesData.map(bus => ({ value: bus.id, label: `${bus.plateNumber} - ${bus.type.name} - ${bus.driver?.name ?? 'No driver'} ${bus.driver ? `- ${bus.driver.email}` : ''}` }))}
                                        onChange={(newValue, _) => {
                                            const newVal: OptionType<string> = newValue as OptionType<string>;
                                            onChange(newVal ? newVal.value : "");
                                        }}
                                        errorMessage={formErrors.busId?.message}
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
                            disabled={!isValid || createTripMutation.isPending || createTripMutation.isSuccess}
                        >
                            {createTripMutation.isPending ? "Creating..." : "Create"}
                        </Button>

                        {createTripMutation.isSuccess && (
                            <>
                                <div className="
                                    text-success dark:text-success bg-success/20 dark:bg-success/20 
                                    border border-success dark:border-success
                                    font-bold mt-4 p-4 rounded-lg flex gap-4
                                ">
                                    <CheckIcon />
                                    <span>Create Trip Successfully!</span>
                                </div>
                            </>
                        )}
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}