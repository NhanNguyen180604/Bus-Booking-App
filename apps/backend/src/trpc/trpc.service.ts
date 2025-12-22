import { Injectable } from '@nestjs/common';
import { initTRPC, TRPCError } from '@trpc/server';
import { TrpcContext } from './trpc.context';
import { UserRoleEnum } from '@repo/shared';

@Injectable()
export class TrpcService {
    trpc: ReturnType<TrpcService['createTrpc']>;
    procedure: typeof this.trpc.procedure;
    router: typeof this.trpc.router;
    mergeRouter: typeof this.trpc.mergeRouters;

    constructor() {
        this.trpc = this.createTrpc();
        this.procedure = this.trpc.procedure;
        this.router = this.trpc.router;
        this.mergeRouter = this.trpc.mergeRouters;
    }

    private createTrpc() {
        return initTRPC.context<TrpcContext>().create();
    }

    publicProcedure() {
        return this.trpc.procedure;
    }

    // if allowedRoles is [], allow all logged in users
    // if specified, only allow those roles, so if there is only GUEST inside allowedRoles, only guests are allowed
    roleGuardMiddleware(...allowedRoles: UserRoleEnum[]) {
        return this.trpc.middleware((opts) => {
            const user = opts.ctx.user;
            const isGuestAllowed = allowedRoles.includes(UserRoleEnum.GUEST);

            if (!user) {
                if (isGuestAllowed) return opts.next();
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'No token',
                });
            }

            if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You are not allowed for this action',
                });
            }
            return opts.next();
        });
    }

    accountVerifiedGuardMiddleware() {
        return this.trpc.middleware((opts) => {
            const user = opts.ctx.user;
            if (user && !user.verified) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Please verify your email to perform this action',
                });
            }
            return opts.next();
        });
    }
}