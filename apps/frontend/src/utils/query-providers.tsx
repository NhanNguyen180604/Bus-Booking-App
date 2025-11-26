"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouterType } from 'backend';
import { TRPCProvider } from "./trpc";

interface MyQueryProviderProps {
    children: React.ReactNode;
};

const QueryProvider = ({ children }: MyQueryProviderProps) => {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
        createTRPCClient<AppRouterType>({
            links: [
                httpBatchLink({
                    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/trpc`,
                    // send cookies
                    fetch(url, options) {
                        return fetch(url, {
                            ...options,
                            credentials: 'include',
                        })
                    }
                }),
            ],
        }),
    );
    return (
        <QueryClientProvider client={queryClient}>
            <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
                {children}
            </TRPCProvider>
        </QueryClientProvider>
    );
}

export default QueryProvider;