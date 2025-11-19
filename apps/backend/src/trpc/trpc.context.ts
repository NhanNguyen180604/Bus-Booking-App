import { User } from '../users/users.entity';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { Request, Response } from 'express';

export const createContext = async (
    opts: CreateExpressContextOptions
): Promise<{ req: Request, res: Response, user?: User }> => {
    return {
        req: opts.req,
        res: opts.res,
        user: opts.req.user,
    };
}

export type TrpcContext = Awaited<ReturnType<typeof createContext>>;
