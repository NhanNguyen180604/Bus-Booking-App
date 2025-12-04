import { Injectable, Logger } from "@nestjs/common";
import { TrpcService } from "../trpc/trpc.service";
import { UserRoleEnum } from "../entities/users.entity";
import { BusTypeCreateOneDto, BusTypeDeleteOneDto, BusTypeFindDto, BusTypeGetOneByIdDto, BusTypeUpdateOneDto } from "@repo/shared";
import { BusTypesService } from "./bus-types.service";

@Injectable()
export class BusTypesRouter {
    constructor(
        private readonly trpcService: TrpcService,
        private readonly busTypesService: BusTypesService,
    ) { }

    apply() {
        Logger.log('Initialized paths /trpc/busTypes', 'BusesRouter');
        return this.trpcService.router({
            createOne: this.trpcService
                .roleGuardProcedure(UserRoleEnum.ADMIN)
                .input(BusTypeCreateOneDto)
                .mutation(({ input }) => {
                    return this.busTypesService.createOne(input);
                }),
            updateOne: this.trpcService
                .roleGuardProcedure(UserRoleEnum.ADMIN)
                .input(BusTypeUpdateOneDto)
                .mutation(({ input }) => {
                    return this.busTypesService.updateOne(input);
                }),
            deleteOne: this.trpcService
                .roleGuardProcedure(UserRoleEnum.ADMIN)
                .input(BusTypeDeleteOneDto)
                .mutation(({ input }) => {
                    return this.busTypesService.deleteOne(input);
                }),
            getOneById: this.trpcService
                .publicProcedure()
                .input(BusTypeGetOneByIdDto)
                .query(({input})=>{
                    return this.busTypesService.getOneById(input);
                }),
            search: this.trpcService
                .publicProcedure()
                .input(BusTypeFindDto)
                .query(({ input }) => {
                    return this.busTypesService.search(input);
                }),
        });
    }
}