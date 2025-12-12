"use client";
import { Button } from "@/src/components/ui/button";
import { Card, CardBody, CardFooter } from "@/src/components/ui/card";
import { FormField } from "@/src/components/ui/form-field";
import { useTRPC } from "@/src/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { StationUpdateOneDto, StationUpdateOneDtoType } from "@repo/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import NotFoundPage from "@/src/components/status-pages/not-found-page";

export default function AdminEditStationPage() {
    const params = useParams<{ id: string }>();
    const trpc = useTRPC();
    const router = useRouter();
    const queryClient = useQueryClient();

    const stationQueryOpts = trpc.stations.findOne.queryOptions({
        id: params.id,
    });
    const stationQuery = useQuery({
        ...stationQueryOpts,
        staleTime: 60 * 60 * 1000,
    });

    useEffect(() => {
        if (stationQuery.isSuccess && stationQuery.data) {
            reset(stationQuery.data);
        }
    }, [stationQuery.isSuccess, stationQuery.data]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors: formErrors, isValid },
        setError,
    } = useForm<StationUpdateOneDtoType>({
        resolver: zodResolver(StationUpdateOneDto),
        mode: "all",
    });

    const updateStationMutationOpts = trpc.stations.updateOne.mutationOptions();
    const updateStationMutation = useMutation({
        ...updateStationMutationOpts,
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
                    message: error.message || "Updating station failed. Please try again.",
                });
            }
        },
        onSuccess(data) {
            queryClient.invalidateQueries({ queryKey: trpc.stations.search.queryKey() });
            queryClient.setQueryData(trpc.stations.findOne.queryKey({ id: data.id }), data);
            setTimeout(() => router.push('/admin/stations'), 3000);
        },
    });

    const onSubmit = (data: StationUpdateOneDtoType) => {
        updateStationMutation.mutate(data);
    }

    if (!stationQuery.isPending && !stationQuery.data) {
        return (
            <NotFoundPage
                header='Station Not Found'
                message="The station you're looking for doesn't exist or has been removed."
                returnBtnText="Go back"
                redirectUrl="/admin/stations"
                routerGoBack
            />
        );
    }

    return (
        <div className="flex flex-col">
            <h1 className="text-[2rem] text-text dark:text-text font-bold mb-8">Edit Station</h1>
            <Button variant="accent" className="self-start mb-8" onClick={() => router.push('/admin/stations')}>Return</Button>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardBody className="gap-x-6 gap-y-4">
                        {formErrors.root && (
                            <div className="col-span-2">
                                <p className="text-danger dark:text-danger font-bold">{formErrors.root.message}</p>
                            </div>
                        )}

                        <input type="hidden" {...register("id")} />

                        <FormField
                            label="Name"
                            placeholder="Hanoi"
                            required
                            {...register("name")}
                            error={formErrors.name?.message}
                        />
                    </CardBody>

                    <CardFooter>
                        <Button
                            type="submit"
                            variant="accent"
                            size="md"
                            fullWidth
                            disabled={!isValid || updateStationMutation.isPending || updateStationMutation.isSuccess}
                        >
                            {updateStationMutation.isPending ? "Updating..." : "Update"}
                        </Button>

                        {updateStationMutation.isSuccess && (
                            <>
                                <div className="col-span-2 text-success dark:text-success font-bold text-center text-xl mt-4">
                                    Update Station Successfully!
                                </div>
                                <div className="col-span-2 text-success dark:text-success font-bold text-center text-xl mt-4">
                                    Returning to Stations Page
                                </div>
                            </>
                        )}
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}