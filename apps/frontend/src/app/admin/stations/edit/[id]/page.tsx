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
import { CancelIcon } from "@/src/components/icons/cancel-ic";
import { CheckIcon } from "@/src/components/icons/check-ic";
import Loading from "@/src/components/ui/loading";

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
        onError(error) {
            setError("root", { message: error.message });
        },
        onSuccess(data) {
            queryClient.invalidateQueries({ queryKey: trpc.stations.search.queryKey() });
            queryClient.setQueryData(trpc.stations.findOne.queryKey({ id: data.id }), data);
            router.push('/admin/stations');
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

    if (stationQuery.isPending) {
        return <Loading />;
    }

    return (
        <div className="flex flex-col">
            <h1 className="text-[2rem] text-text dark:text-text font-bold mb-8">Edit Station</h1>
            <Button variant="accent" className="self-start mb-8" onClick={() => router.push('/admin/stations')}>Return</Button>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardBody className="gap-x-6 gap-y-4">
                        <input type="hidden" {...register("id")} />

                        <FormField
                            label="Name"
                            placeholder="Hanoi"
                            required
                            {...register("name")}
                            error={formErrors.name?.message}
                        />
                    </CardBody>

                    <CardFooter className="rounded-lg">
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
                            <div className="col-span-2
                                text-success dark:text-success bg-success/20 dark:bg-success/20 
                                border border-success dark:border-success
                                font-bold text-center p-4 rounded-lg flex gap-4 mt-8
                            ">
                                <CheckIcon />
                                <span>Update Station Successfully!</span>
                            </div>
                        )}

                        {formErrors.root && (
                            <div className="col-span-2
                                text-danger dark:text-danger bg-danger/20 dark:bg-danger/20 
                                border border-danger dark:border-danger
                                font-bold p-4 rounded-lg flex gap-4 mt-8
                            ">
                                <CancelIcon />
                                <span>{formErrors.root.message}</span>
                            </div>
                        )}
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}