"use client"
import { Button } from "@/src/components/ui/button";
import { Card, CardBody, CardFooter } from "@/src/components/ui/card";
import { FormField } from "@/src/components/ui/form-field";
import { OptionType, SelectDropdown } from "@/src/components/ui/select-dropdown";
import { useTRPC } from "@/src/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { RouteCreateOneDto, RouteCreateOneDtoType } from "@repo/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { CancelIcon } from "@/src/components/icons/cancel-ic";
import { CheckIcon } from "@/src/components/icons/check-ic";
import Loading from "@/src/components/ui/loading";

export default function AdminCreateNewRoutePage() {
    const trpc = useTRPC();
    const router = useRouter();
    const queryClient = useQueryClient();

    const stationsQuery = useQuery({
        ...trpc.stations.findAll.queryOptions(),
        staleTime: 10 * 60 * 1000,
    });

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
        onError(error) {
            setError("root", { message: error.message });
        },
        onSuccess(data) {
            queryClient.invalidateQueries({ queryKey: trpc.routes.search.queryKey() });
            queryClient.setQueryData(trpc.routes.findOneById.queryKey({ id: data.id }), data);
            router.push('/admin/routes');
        },
    });

    const onSubmit = (data: RouteCreateOneDtoType) => {
        createRouteMutation.mutate(data);
    }

    const stationData = stationsQuery.data ?? [];

    if (stationsQuery.isPending) {
        return <Loading />;
    }

    return (
        <div className="flex flex-col">
            <h1 className="text-[2rem] text-text dark:text-text font-bold mb-8">Create New Route</h1>
            <Button variant="accent" className="self-start mb-8" onClick={() => router.push('/admin/routes')}>Return</Button>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardBody className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {/* station dropdowns */}
                        <Controller control={control}
                            name="originId"
                            render={({ field: { onChange } }) => (
                                <SelectDropdown label="Origin" isClearable required
                                    options={stationData.map(station => ({ value: station.id, label: station.name }))}
                                    onChange={(newValue, _) => {
                                        const newVal: OptionType<string> = newValue as OptionType<string>;
                                        onChange(newVal ? newVal.value : "");
                                    }}
                                    errorMessage={formErrors.originId?.message}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                />
                            )}
                        />
                        <Controller control={control}
                            name="destinationId"
                            render={({ field: { onChange } }) => (
                                <SelectDropdown label="Destination" isClearable required
                                    options={stationData.map(station => ({ value: station.id, label: station.name }))}
                                    onChange={(newValue, _) => {
                                        const newVal: OptionType<string> = newValue as OptionType<string>;
                                        onChange(newVal ? newVal.value : "");
                                    }}
                                    errorMessage={formErrors.destinationId?.message}
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

                    <CardFooter className="rounded-lg">
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
                            <div className="col-span-2
                                text-success dark:text-success bg-success/20 dark:bg-success/20 
                                border border-success dark:border-success
                                font-bold text-center p-4 rounded-lg flex gap-4 mt-8
                            ">
                                <CheckIcon />
                                <span>Create Route Successfully!</span>
                            </div>
                        )}

                        {formErrors.root && (
                            <div className="col-span-2
                                text-danger dark:text-danger bg-danger/20 dark:bg-danger/20 
                                border border-danger dark:border-danger
                                font-bold p-4 rounded-lg flex gap-4 mt-8
                            ">
                                <CancelIcon /> <span>{formErrors.root.message}</span>
                            </div>
                        )}
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}