"use client";
import { AppShell } from "@/src/components/layout/app-shell";
import ForbiddenPage from "@/src/components/status-pages/forbidden-page";
import UnauthorizedPage from "@/src/components/status-pages/unauthorized-page";
import { Button } from "@/src/components/ui/button";
import { Card, CardHeader, CardBody, CardFooter } from "@/src/components/ui/card";
import Loading from "@/src/components/ui/loading";
import useUser from "@/src/hooks/useUser";
import { useTRPC } from "@/src/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function UserSendVerificationPage() {
    const trpc = useTRPC();
    const params = useSearchParams();
    const register = params.get("register") === 'true';
    const user = useUser();

    const requestEmailVerificationMutation = useMutation({
        ...trpc.users.requestEmailVerification.mutationOptions()
    });

    useEffect(() => {
        if (user.data?.verified === false && register) {
            requestEmailVerificationMutation.mutate();
        }
    }, [user.data]);

    if (user.isPending) {
        return <Loading />
    }

    if (user.isError) {
        return <UnauthorizedPage message="You are not logged in" />
    }

    if (user.data && user.data.verified) {
        return <ForbiddenPage
            message="Your account is already verified"
        />
    }

    return (
        <AppShell hideNav hideFooter>
            <div className="py-8 lg:px-4 h-full flex flex-col items-stretch md:items-center">
                <Card className="md:min-w-xl space-y-4">
                    <CardHeader className="mx-4 mt-2 rounded-lg gap-x-2">
                        <h1 className=" font-bold text-2xl text-center text-text dark:text-text">{register ? '' : 'Please '}Verify Your Email</h1>
                    </CardHeader>
                    <CardBody className="bg-accent/20 border border-accent mx-6 rounded-lg">
                        {register ? (
                            <>
                                <div className="text-text dark:text-text">An email has been sent to your mail address.</div>
                                <div className="text-text dark:text-text">Follow the link to verify your email.</div>
                            </>
                        ) : (
                            <>
                                <div className="text-text dark:text-text">This helps us secure your account.</div>
                                <div className="text-text dark:text-text">Click the button below to send the verification email.</div>
                            </>
                        )}
                    </CardBody>
                    <CardFooter className="rounded-lg flex flex-col mb-2">
                        <Button
                            variant="accent"
                            className=""
                            disabled={requestEmailVerificationMutation.isPending}
                            onClick={(e) => {
                                requestEmailVerificationMutation.mutate();
                            }}
                        >
                            {requestEmailVerificationMutation.isPending ? "Sending..." : `${register ? 'Resend Verification Email' : 'Send Verification Email'}`}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppShell >
    );
}