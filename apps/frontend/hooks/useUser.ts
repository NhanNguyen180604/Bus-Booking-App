import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "../utils/trpc";

export default function useUser(){
    const trpc = useTRPC();

    const userQueryOptions = trpc.users.getMe.queryOptions();
    const userQuery = useQuery({
        ...userQueryOptions,
        retry: false,
        staleTime: 60 * 60 * 1000,
        refetchOnMount: false,
    });

    return userQuery;
}