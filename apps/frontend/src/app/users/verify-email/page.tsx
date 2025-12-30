"use client";
import { CancelIcon } from "@/src/components/icons/cancel-ic";
import { CheckIcon } from "@/src/components/icons/check-ic";
import { AppShell } from "@/src/components/layout/app-shell";
import ForbiddenPage from "@/src/components/status-pages/forbidden-page";
import UnauthorizedPage from "@/src/components/status-pages/unauthorized-page";
import { Card, CardBody, CardHeader } from "@/src/components/ui/card";
import Loading from "@/src/components/ui/loading";
import useUser from "@/src/hooks/useUser";
import { useTRPC } from "@/src/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

export default function UserVerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || '';
    const trpc = useTRPC();
    const user = useUser();

    const verifyEmailQueryOpts = trpc.users.verifyEmail.queryOptions({ token }, { enabled: token.length > 0 });
    const verifyEmailQuery = useQuery({
        ...verifyEmailQueryOpts,
        staleTime: 60 * 60 * 1000,
        retry: false,
    });

    if (user.isPending || verifyEmailQuery.isPending) {
        return <Loading />;
    }

    if (user.isError) {
        return <UnauthorizedPage message="You are not logged in" />
    }

    if (user.data && user.data.verified) {
        return <ForbiddenPage
            message="Your account is already verified"
        />
    }

    if (!token.length) {
        return <UnauthorizedPage
            header="No token"
            message="Invalid token to verify your email"
            routerGoBack={true}
        />
    }

    if (verifyEmailQuery.isError) {
        return (
            <AppShell hideNav hideFooter>
                <div className="py-8 lg:px-4 h-full flex flex-col items-stretch md:items-center">
                    <Card className="md:min-w-xl">
                        <CardHeader className="
                        bg-danger/20 dark:bg-danger/20
                        border border-danger dark:border-danger 
                        m-6 rounded-lg 
                        flex items-center justify-center gap-x-2
                    ">
                            <CancelIcon className="text-danger dark:text-danger" />
                            <h1 className="text-danger dark:text-danger font-bold text-2xl text-center">Error Verifying Email</h1>
                        </CardHeader>
                        <CardBody className="flex flex-col items-start mb-2">
                            <div className="text-danger dark:text-danger font-semibold">
                                {verifyEmailQuery.error.message}
                            </div>
                            <button
                                className="text-accent hover:underline cursor-pointer self-center mt-4"
                                onClick={(e) => {
                                    e.preventDefault();
                                    router.push('/');
                                }}
                            >
                                Back to Home Page
                            </button>
                        </CardBody>
                    </Card>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell hideNav hideFooter>
            <div className="py-8 lg:px-4 h-full flex flex-col items-stretch md:items-center">
                <Card className="md:min-w-xl">
                    <CardHeader className="
                        bg-success/20 dark:bg-success/20
                        border border-success dark:border-success 
                        m-6 rounded-lg 
                        flex items-center justify-center gap-x-2
                    ">
                        <CheckIcon className="text-success dark:text-success" />
                        <h1 className="text-success dark:text-success font-bold text-2xl text-center">Email verified</h1>
                    </CardHeader>
                    <CardBody className="text-center mb-2">
                        <button
                            className="text-accent hover:underline cursor-pointer"
                            onClick={(e) => {
                                e.preventDefault();
                                router.push('/');
                            }}
                        >
                            Return Home
                        </button>
                    </CardBody>
                </Card>
            </div>
        </AppShell>
    );
}