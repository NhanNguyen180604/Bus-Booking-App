import { Injectable } from '@nestjs/common';
import { initTRPC } from '@trpc/server';

@Injectable()
export class TrpcService {
    trpc = initTRPC.create();
    procedure = this.trpc.procedure;
    router = this.trpc.router;
    mergeRouter = this.trpc.mergeRouters;

    publicProcedure() {
        return this.trpc.procedure;
    }

    protectedProcedure(allowedRoles?: string[]) {
        const procedure = this.trpc.procedure;
        // TODO: add authorization
        return procedure;
    }
}
