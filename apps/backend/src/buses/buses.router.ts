import { Injectable, Logger } from "@nestjs/common";
import { TrpcService } from "../trpc/trpc.service";
import { BusesService } from "./buses.service";
import { UserRoleEnum } from "../entities/users.entity";
import { BusAddSeatsDto, BusCreateOneDto, BusCreateOneWithSeatsDto, BusDeleteOneDto, BusGetOneByIdDto, BusGetSeatsByBusIdDto, BusSearchDto, } from "@repo/shared";

@Injectable()
export class BusesRouter {
    constructor(
        private readonly trpcService: TrpcService,
        private readonly busesService: BusesService,
    ) { }

    apply() {
        Logger.log('Initialized paths /trpc/buses', 'BusesRouter');
        return this.trpcService.router({
            createOne: this.trpcService
                .roleGuardProcedure(UserRoleEnum.ADMIN)
                .input(BusCreateOneDto)
                .mutation(({ input }) => {
                    return this.busesService.createOne(input);
                }),
            createOneWithSeats: this.trpcService
                .roleGuardProcedure(UserRoleEnum.ADMIN)
                .input(BusCreateOneWithSeatsDto)
                .mutation(({ input }) => {
                    return this.busesService.createOneWithSeats(input);
                }),
            getOneById: this.trpcService
                .publicProcedure()
                .input(BusGetOneByIdDto)
                .query(({ input }) => {
                    return this.busesService.getOneBusById(input);
                }),
            deleteOne: this.trpcService
                .roleGuardProcedure(UserRoleEnum.ADMIN)
                .input(BusDeleteOneDto)
                .mutation(({ input }) => {
                    return this.busesService.deleteOne(input);
                }),
            addSeats: this.trpcService
                .roleGuardProcedure(UserRoleEnum.ADMIN)
                .input(BusAddSeatsDto)
                .mutation(({ input }) => {
                    return this.busesService.addSeats(input);
                }),
            getSeatsByBus: this.trpcService
                .publicProcedure()
                .input(BusGetSeatsByBusIdDto)
                .query(({ input }) => {
                    return this.busesService.getSeatsByBus(input);
                }),
            searchBus: this.trpcService
                .publicProcedure()
                .input(BusSearchDto)
                .query(({ input }) => {
                    return this.busesService.searchBus(input);
                }),
        });
    }
}