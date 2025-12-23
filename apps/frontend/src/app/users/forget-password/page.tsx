"use client";;
import { CancelIcon } from "@/src/components/icons/cancel-ic";
import { CheckIcon } from "@/src/components/icons/check-ic";
import { AppShell } from "@/src/components/layout/app-shell";
import { Button } from "@/src/components/ui/button";
import { Card, CardHeader, CardBody, CardFooter } from "@/src/components/ui/card";
import { FormField } from "@/src/components/ui/form-field";
import { useTRPC } from "@/src/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserForgetPasswordDto, UserForgetPasswordDtoType } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

export default function UserForgetPasswordPage() {
    const trpc = useTRPC();

    const forgetPasswordForm = useForm<UserForgetPasswordDtoType>({
        resolver: zodResolver(UserForgetPasswordDto),
    });
    const postForgetPasswordMutation = useMutation({
        ...trpc.users.postForgetPassword.mutationOptions(),
        onError(error) {
            forgetPasswordForm.setError('root', { message: error.message });
        }
    });

    const onSubmit = (data: UserForgetPasswordDtoType) => {
        postForgetPasswordMutation.mutate(data);
    }

    return (
        <AppShell hideNav hideFooter>
            <div className="py-8 lg:px-4 h-full flex flex-col items-stretch md:items-center">
                <form onSubmit={forgetPasswordForm.handleSubmit(onSubmit)}>
                    <Card className="md:min-w-xl space-y-4">
                        <CardHeader className="mx-4 mt-2 rounded-lg gap-x-2">
                            <h1 className=" font-bold text-2xl text-center text-text dark:text-text">Enter Your Email To Reset Password</h1>
                        </CardHeader>
                        <CardBody>
                            <FormField label="Email" required
                                {...forgetPasswordForm.register('email')}
                                error={forgetPasswordForm.formState.errors.email?.message}
                                placeholder="Your email"
                            />
                        </CardBody>
                        <CardFooter className="rounded-lg">
                            <Button variant="accent" fullWidth
                                type="submit"
                                className="transition-all"
                                disabled={postForgetPasswordMutation.isPending || !forgetPasswordForm.formState.isValid}
                            >
                                {postForgetPasswordMutation.isPending ? 'Submitting...' : 'Submit'}
                            </Button>
                            {postForgetPasswordMutation.isSuccess && (
                                <div className="
                            bg-success/20 dark:bg-success/20 border border-success dark:border-success text-success
                            rounded-lg p-4 flex gap-4 items-center font-semibold mt-6
                            ">
                                    <CheckIcon />
                                    <div>
                                        <div className="text-success dark:text-success">An email has been sent to your mail address.</div>
                                        <div className="text-success dark:text-success">Follow the link to verify your email.</div>
                                    </div>
                                </div>
                            )}
                            {forgetPasswordForm.formState.errors.root && (
                                <div className="
                            bg-danger/20 dark:bg-danger/20 border border-danger dark:border-danger text-danger
                            rounded-lg p-4 flex gap-4 mt-6
                            ">
                                    <CancelIcon /> <span className="font-semibold">{forgetPasswordForm.formState.errors.root.message}</span>
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </AppShell >
    );
}