import { Injectable, Logger } from "@nestjs/common";
import { TrpcService } from "../trpc/trpc.service";
import { BusesService } from "./buses.service";
import { UserRoleEnum } from "../entities/users.entity";
import { BusAddSeatsDto, BusCreateOneDto, BusGetSeatsByBusIdDto, } from "@repo/shared";

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
        });
    }
}