import { Injectable } from '@nestjs/common';
import { initTRPC } from '@trpc/server';
import { TrpcContext } from './trpc.context';

@Injectable()
export class TrpcService {
    trpc: ReturnType<TrpcService['createTrpc']>;
    procedure: typeof this.trpc.procedure;
    router: typeof this.trpc.router;
    mergeRouter: typeof this.trpc.mergeRouters;

    constructor(
    ) {
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

    protectedProcedure(allowedRoles?: string[]) {
        const procedure = this.trpc.procedure.use(async (opts) => {
            // TODO: add authorization
            return opts.next();
        });
        return procedure;
    }
}