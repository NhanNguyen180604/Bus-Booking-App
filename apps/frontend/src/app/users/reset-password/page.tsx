"use client"
import { CancelIcon } from "@/src/components/icons/cancel-ic";
import { CheckIcon } from "@/src/components/icons/check-ic";
import { AppShell } from "@/src/components/layout/app-shell";
import UnauthorizedPage from "@/src/components/status-pages/unauthorized-page";
import { Button } from "@/src/components/ui/button";
import { Card, CardHeader, CardBody, CardFooter } from "@/src/components/ui/card";
import { FormField } from "@/src/components/ui/form-field";
import { useTRPC } from "@/src/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserResetPasswordDto, UserResetPasswordDtoType } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

export default function UserResetPasswordPage() {
    const trpc = useTRPC();
    const params = useSearchParams();
    const token = params.get('token');
    const router = useRouter();

    const resetPasswordForm = useForm<UserResetPasswordDtoType>({
        resolver: zodResolver(UserResetPasswordDto),
        defaultValues: {
            token: token ?? '',
        },
        mode: 'all',
    });
    const resetPasswordMutation = useMutation({
        ...trpc.users.resetPassword.mutationOptions(),
        onSuccess() {
            router.push('/users/login');
        },
        onError(error) {
            resetPasswordForm.setError('root', { message: error.message });
        }
    });

    if (!token) {
        return <UnauthorizedPage
            header="No token"
            message="You have no token to reset your password" />;
    }

    const onSubmit = (data: UserResetPasswordDtoType) => {
        resetPasswordMutation.mutate(data);
    }
    return (
        <AppShell hideNav hideFooter>
            <div className="py-8 lg:px-4 h-full flex flex-col items-stretch md:items-center">
                <form onSubmit={resetPasswordForm.handleSubmit(onSubmit)}>
                    <Card className="md:min-w-xl space-y-4 md:w-lg lg:w-xl">
                        <CardHeader className="mx-4 mt-2 rounded-lg gap-x-2">
                            <h1 className=" font-bold text-2xl text-center text-text dark:text-text">Enter Your Email</h1>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <FormField label="New Password" required
                                {...resetPasswordForm.register('newPassword')}
                                error={resetPasswordForm.formState.errors.newPassword?.message}
                                placeholder="Your New Password"
                                type="password"
                            />
                            <FormField label="Confirm New Password" required
                                {...resetPasswordForm.register('confirmNewPassword')}
                                error={resetPasswordForm.formState.errors.confirmNewPassword?.message}
                                placeholder="Confirm Your New Password"
                                type="password"
                            />
                        </CardBody>
                        <CardFooter className="rounded-lg">
                            <Button variant="accent" fullWidth
                                type="submit"
                                className="transition-all"
                                disabled={resetPasswordMutation.isPending || !resetPasswordForm.formState.isValid}
                            >
                                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset'}
                            </Button>
                            {resetPasswordMutation.isSuccess && (
                                <div className="
                            bg-success/20 dark:bg-success/20 border border-success dark:border-success text-success
                            rounded-lg p-4 flex gap-4 mt-6
                            ">
                                    <CheckIcon /> <span className="font-semibold">Password Reset Successfully</span>
                                </div>
                            )}
                            {resetPasswordForm.formState.errors.root && (
                                <div className="
                            bg-danger/20 dark:bg-danger/20 border border-danger dark:border-danger text-danger
                            rounded-lg p-4 flex gap-4 mt-6
                            ">
                                    <CancelIcon /> <span className="font-semibold">{resetPasswordForm.formState.errors.root.message}</span>
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </AppShell >
    );
}