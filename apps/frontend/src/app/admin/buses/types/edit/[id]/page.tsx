"use client"
import { Button } from "@/src/components/ui/button";
import { Card, CardBody, CardFooter } from "@/src/components/ui/card";
import { FormField } from "@/src/components/ui/form-field";
import { useTRPC } from "@/src/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { BusTypeUpdateOneDto, BusTypeUpdateOneDtoType } from "@repo/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import NotFoundPage from "@/src/components/status-pages/not-found-page";
import { CancelIcon } from "@/src/components/icons/cancel-ic";
import { CheckIcon } from "@/src/components/icons/check-ic";

export default function AdminEditRoutePage() {
    const params = useParams<{ id: string }>();
    const trpc = useTRPC();
    const router = useRouter();
    const queryClient = useQueryClient();

    const busTypeQueryOpts = trpc.busTypes.getOneById.queryOptions({
        id: params.id,
    });
    const busTypeQuery = useQuery({
        ...busTypeQueryOpts,
        staleTime: 60 * 60 * 1000,
    });

    useEffect(() => {
        if (busTypeQuery.isSuccess) {
            reset(busTypeQuery.data);
        }
    }, [busTypeQuery.isSuccess]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors: formErrors, isValid },
        setError,
    } = useForm<BusTypeUpdateOneDtoType>({
        resolver: zodResolver(BusTypeUpdateOneDto),
        mode: "all",
    });

    const updateBusTypeMutationOpts = trpc.busTypes.updateOne.mutationOptions();
    const updateBusTypeMutation = useMutation({
        ...updateBusTypeMutationOpts,
        onError(error) {
            setError("root", { message: error.message });
        },
        onSuccess(data) {
            queryClient.invalidateQueries({ queryKey: trpc.busTypes.search.queryKey() });
            queryClient.setQueryData(trpc.busTypes.getOneById.queryKey({ id: data.id }), data);
            router.push("/admin/buses?tab=1");
        },
    });

    const onSubmit = (data: BusTypeUpdateOneDtoType) => {
        updateBusTypeMutation.mutate(data);
    }

    if (!busTypeQuery.isPending && !busTypeQuery.data) {
        return (
            <NotFoundPage
                header='Bus Type Not Found'
                message="The bus type you're looking for doesn't exist or has been removed."
                returnBtnText="Go back"
                redirectUrl="/admin/buses?tab=1"
                routerGoBack
            />
        );
    }

    return (
        <div className="flex flex-col">
            <h1 className="text-[2rem] text-text dark:text-text font-bold mb-8">Edit Bus Type</h1>
            <Button variant="accent" className="self-start mb-8" onClick={() => router.push('/admin/buses?tab=1')}>Return</Button>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardBody className="gap-x-6 gap-y-4">
                        <FormField
                            label="Name"
                            placeholder="Sleeper"
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
                            disabled={!isValid || updateBusTypeMutation.isPending || updateBusTypeMutation.isSuccess}
                        >
                            {updateBusTypeMutation.isPending ? "Updating..." : "Update"}
                        </Button>

                        {updateBusTypeMutation.isSuccess && (
                            <div className="col-span-2
                                text-success dark:text-success bg-success/20 dark:bg-success/20 
                                border border-success dark:border-success
                                font-bold text-center p-4 rounded-lg flex gap-4 mt-8
                            ">
                                <CheckIcon />
                                <span>Edit Bus Type Successfully!</span>
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