import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouterType } from 'backend';

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouterType>();