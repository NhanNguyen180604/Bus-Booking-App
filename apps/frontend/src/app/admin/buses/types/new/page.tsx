"use client"
import { Button } from "@/src/components/ui/button";
import { Card, CardBody, CardFooter } from "@/src/components/ui/card";
import { FormField } from "@/src/components/ui/form-field";
import { useTRPC } from "@/src/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { BusTypeCreateOneDto, BusTypeCreateOneDtoType } from "@repo/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

export default function AdminCreateNewBusTypePage() {
    const trpc = useTRPC();
    const router = useRouter();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        formState: { errors: formErrors, isValid },
        setError,
    } = useForm<BusTypeCreateOneDtoType>({
        resolver: zodResolver(BusTypeCreateOneDto),
        mode: "all",
    });

    const createBusTypeMutationOpts = trpc.busTypes.createOne.mutationOptions();
    const createBusTypeMutation = useMutation({
        ...createBusTypeMutationOpts,
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
                    message: error.message || "Creating new bus type failed. Please try again.",
                });
            }
        },
        onSuccess(data) {
            queryClient.invalidateQueries({ queryKey: trpc.busTypes.search.queryKey() });
            queryClient.setQueryData(trpc.busTypes.getOneById.queryKey({ id: data.id }), data);
            setTimeout(() => router.push('/admin/buses'), 3000);
        },
    });

    const onSubmit = (data: BusTypeCreateOneDtoType) => {
        createBusTypeMutation.mutate(data);
    }

    return (
        <div className="flex flex-col">
            <h1 className="text-[2rem] text-text dark:text-text font-bold mb-8">Create New Bus Type</h1>
            <Button variant="accent" className="self-start mb-8" onClick={() => router.push('/admin/buses')}>Return</Button>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardBody className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {formErrors.root && (
                            <div className="col-span-2">
                                <p className="text-danger dark:text-danger font-bold">{formErrors.root.message}</p>
                            </div>
                        )}

                        {/* station dropdowns */}
                        <FormField
                            label="Name"
                            placeholder="Sleeper"
                            required
                            {...register("name")}
                            error={formErrors.name?.message}
                        />
                        <FormField
                            label="Price Multiplier"
                            placeholder="1"
                            required
                            {...register("priceMultiplier", { valueAsNumber: true })}
                            error={formErrors.priceMultiplier?.message}
                        />
                    </CardBody>

                    <CardFooter>
                        <Button
                            type="submit"
                            variant="accent"
                            size="md"
                            fullWidth
                            disabled={!isValid || createBusTypeMutation.isPending || createBusTypeMutation.isSuccess}
                        >
                            {createBusTypeMutation.isPending ? "Creating..." : "Create"}
                        </Button>

                        {createBusTypeMutation.isSuccess && (
                            <>
                                <div className="col-span-2 text-success dark:text-success font-bold text-center text-xl mt-4">
                                    Create Bus Type Successfully!
                                </div>
                                <div className="col-span-2 text-success dark:text-success font-bold text-center text-xl mt-4">
                                    Returning to Buses Page
                                </div>
                            </>
                        )}
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}