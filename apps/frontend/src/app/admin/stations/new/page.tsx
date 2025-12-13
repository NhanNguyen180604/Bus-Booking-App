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
                    message: error.message || "Creating new station failed. Please try again.",
                });
            }
        },
        onSuccess(data) {
            queryClient.invalidateQueries({ queryKey: trpc.stations.search.queryKey() });
            queryClient.setQueryData(trpc.stations.findOne.queryKey({ id: data.id }), data);
            setTimeout(() => router.push('/admin/stations'), 3000);
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
                        {formErrors.root && (
                            <div className="col-span-2">
                                <p className="text-danger dark:text-danger font-bold">{formErrors.root.message}</p>
                            </div>
                        )}

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
                            disabled={!isValid || createStationMutation.isPending || createStationMutation.isSuccess}
                        >
                            {createStationMutation.isPending ? "Creating..." : "Create"}
                        </Button>

                        {createStationMutation.isSuccess && (
                            <>
                                <div className="col-span-2 text-success dark:text-success font-bold text-center text-xl mt-4">
                                    Create Station Successfully!
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