import { Injectable } from '@nestjs/common';
import { initTRPC, TRPCError } from '@trpc/server';
import { TrpcContext } from './trpc.context';
import { UserRoleEnum } from '../users/user-role.enum';

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

    roleGuardProcedure(...allowedRoles: UserRoleEnum[]) {
        const procedure = this.trpc.procedure.use(async (opts) => {
            const user = opts.ctx.user;
            if (!user) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'No token',
                });
            }

            if (allowedRoles.length === 0) {
                return opts.next();
            }

            if (!allowedRoles.includes(user.role)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You are not allowed for this action',
                });
            }
            return opts.next();
        });
        return procedure;
    }
}