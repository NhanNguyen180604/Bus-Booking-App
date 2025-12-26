"use client"
import { Button } from "@/src/components/ui/button";
import { Card, CardBody, CardFooter } from "@/src/components/ui/card";
import { FormField } from "@/src/components/ui/form-field";
import { useTRPC } from "@/src/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { StationCreateDto, StationCreateDtoType } from "@repo/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { CancelIcon } from "@/src/components/icons/cancel-ic";
import { CheckIcon } from "@/src/components/icons/check-ic";

export default function AdminCreateNewStationPage() {
    const trpc = useTRPC();
    const router = useRouter();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        formState: { errors: formErrors, isValid },
        setError,
    } = useForm<StationCreateDtoType>({
        resolver: zodResolver(StationCreateDto),
        mode: "all",
    });

    const createStationMutationOpts = trpc.stations.createOne.mutationOptions();
    const createStationMutation = useMutation({
        ...createStationMutationOpts,
        onError(error) {
            setError("root", { message: error.message });
        },
        onSuccess(data) {
            queryClient.invalidateQueries({ queryKey: trpc.stations.search.queryKey() });
            queryClient.setQueryData(trpc.stations.findOne.queryKey({ id: data.id }), data);
            router.push('/admin/stations');
        },
    });

    const onSubmit = (data: StationCreateDtoType) => {
        createStationMutation.mutate(data);
    }

    return (
        <div className="flex flex-col">
            <h1 className="text-[2rem] text-text dark:text-text font-bold mb-8">Create New Station</h1>
            <Button variant="accent" className="self-start mb-8" onClick={() => router.push('/admin/stations')}>Return</Button>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardBody className="gap-x-6 gap-y-4">
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
                            disabled={!isValid || createStationMutation.isPending || createStationMutation.isSuccess}
                        >
                            {createStationMutation.isPending ? "Creating..." : "Create"}
                        </Button>

                        {createStationMutation.isSuccess && (
                            <div className="col-span-2
                                text-success dark:text-success bg-success/20 dark:bg-success/20 
                                border border-success dark:border-success
                                font-bold text-center p-4 rounded-lg flex gap-4 mt-8
                            ">
                                <CheckIcon />
                                <span>Create Station Successfully!</span>
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