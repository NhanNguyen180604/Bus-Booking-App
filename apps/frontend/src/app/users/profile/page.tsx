"use client"
import { CheckIcon } from "@/src/components/icons/check-ic";
import UnauthorizedPage from "@/src/components/status-pages/unauthorized-page";
import { Button } from "@/src/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/src/components/ui/card";
import { FormField } from "@/src/components/ui/form-field";
import Loading from "@/src/components/ui/loading";
import useUser from "@/src/hooks/useUser";
import { useTRPC } from "@/src/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserChangePasswordDto, UserChangePasswordDtoType, UserUpdateProfileDto, UserUpdateProfileDtoType } from "@repo/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function UserProfilePage() {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const userQuery = useUser();
    const router = useRouter();

    const updateProfileMutation = useMutation({
        ...trpc.users.updateProfile.mutationOptions(),
        onSuccess(data) {
            queryClient.setQueryData(trpc.users.getMe.queryKey(), data);
        },
        onError(error) {
            updateProfileForm.setError('root', { message: error.message });
        },
    });
    const updateProfileForm = useForm<UserUpdateProfileDtoType>({
        resolver: zodResolver(UserUpdateProfileDto),
        mode: 'all'
    });
    useEffect(() => {
        const oldData = updateProfileForm.watch();
        if (userQuery.data) {
            updateProfileForm.reset({
                ...oldData,
                name: userQuery.data.name,
            });
        }
    }, [userQuery.data]);


    const changePasswordMutation = useMutation({
        ...trpc.users.changePassword.mutationOptions(),
        onSuccess(data) {
            queryClient.removeQueries({ queryKey: trpc.users.getMe.queryKey() });
            router.push('/users/login');
        },
        onError(error) {
            changePasswordForm.setError('root', { message: error.message });
        },
    });
    const changePasswordForm = useForm<UserChangePasswordDtoType>({
        resolver: zodResolver(UserChangePasswordDto),
        mode: 'all',
    });

    if (userQuery.isPending) {
        return <Loading />
    }

    if (userQuery.isError || !userQuery.data) {
        return <UnauthorizedPage header="Not Logged In"
            routerGoBack />;
    }

    const onUpdateProfileSubmit = (data: UserUpdateProfileDtoType) => {
        updateProfileMutation.mutate(data);
    }

    const onChangePasswordSubmit = (data: UserChangePasswordDtoType) => {
        changePasswordMutation.mutate(data);
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:px-16 xl:px-32">
            <div className="col-span-1 lg:col-span-2 flex flex-col gap-4">
                <form onSubmit={updateProfileForm.handleSubmit(onUpdateProfileSubmit)}>
                    <Card>
                        <CardHeader className="text-2xl font-bold text-text dark:text-text">Your Profile</CardHeader>
                        <CardBody>
                            <FormField
                                label="Full Name"
                                required
                                {...updateProfileForm.register('name')}
                                error={updateProfileForm.formState.errors.name?.message}
                            />
                        </CardBody>
                        <CardFooter className="rounded-lg">
                            <Button variant="accent" fullWidth
                                type="submit"
                                className="transition-all"
                                disabled={updateProfileMutation.isPending || !updateProfileForm.formState.isValid}
                            >
                                {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                            </Button>

                            {updateProfileMutation.isSuccess && (
                                <div className="
                            bg-success/20 dark:bg-success/20 border border-success dark:border-success text-success
                            rounded-lg p-4 flex gap-4 mt-6
                            ">
                                    <CheckIcon /> <span className="font-semibold">Update Profile Successfully</span>
                                </div>
                            )}
                            {updateProfileForm.formState.errors.root && (
                                <div className="
                            bg-danger/20 dark:bg-danger/20 border border-danger dark:border-danger text-danger
                            rounded-lg p-4 flex gap-4 mt-6
                            ">
                                    <CheckIcon /> <span className="font-semibold">{updateProfileForm.formState.errors.root.message}</span>
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                </form>
                <form onSubmit={changePasswordForm.handleSubmit(onChangePasswordSubmit)}>
                    <Card>
                        <CardHeader className="text-2xl font-bold text-text dark:text-text">Change Password</CardHeader>
                        <CardBody className="space-y-2">
                            <FormField
                                label="Old Password"
                                type="password"
                                required
                                {...changePasswordForm.register('oldPassword')}
                                error={changePasswordForm.formState.errors.oldPassword?.message}
                            />
                            <FormField
                                label="New Password"
                                type="password"
                                required
                                {...changePasswordForm.register('newPassword')}
                                error={changePasswordForm.formState.errors.newPassword?.message}
                            />
                            <FormField
                                label="Confirm New Password"
                                type="password"
                                required
                                {...changePasswordForm.register('confirmNewPassword')}
                                error={changePasswordForm.formState.errors.confirmNewPassword?.message}
                            />
                        </CardBody>
                        <CardFooter className="rounded-lg">
                            <Button variant="accent" fullWidth
                                type="submit"
                                className="transition-all"
                                disabled={changePasswordMutation.isPending || !changePasswordForm.formState.isValid}
                            >
                                {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                            </Button>
                            {changePasswordMutation.isSuccess && (
                                <div className="
                            bg-success/20 dark:bg-success/20 border border-success dark:border-success text-success
                            rounded-lg p-4 flex gap-4 mt-6
                            ">
                                    <CheckIcon /> <span className="font-semibold">Password Changed Successfully</span>
                                </div>
                            )}
                            {changePasswordForm.formState.errors.root && (
                                <div className="
                            bg-danger/20 dark:bg-danger/20 border border-danger dark:border-danger text-danger
                            rounded-lg p-4 flex gap-4 mt-6
                            ">
                                    <CheckIcon /> <span className="font-semibold">{changePasswordForm.formState.errors.root.message}</span>
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                </form>
            </div>
            <Card className="col-span-1">

            </Card>
        </div>
    );
}