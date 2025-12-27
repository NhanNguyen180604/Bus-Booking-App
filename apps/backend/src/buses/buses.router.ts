import { Injectable, Logger } from "@nestjs/common";
import { TrpcService } from "../trpc/trpc.service";
import { BusesService } from "./buses.service";
import { BusUpdateOneDto, UserRoleEnum } from "@repo/shared";
import { BusAddSeatsDto, BusCreateOneDto, BusCreateOneWithSeatsDto, BusDeleteOneDto, BusGetOneByIdDto, BusGetSeatsByBusIdDto, BusSearchDto, BusSeatsGetManyByIdsDto, } from "@repo/shared";

@Injectable()
export class BusesRouter {
    constructor(
        private readonly trpcService: TrpcService,
        private readonly busesService: BusesService,
    ) { }

    apply() {
        Logger.log('Initialized paths /trpc/buses', 'BusesRouter');
        return this.trpcService.router({
            createOne: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.ADMIN))
                .input(BusCreateOneDto)
                .mutation(({ input }) => {
                    return this.busesService.createOne(input);
                }),
            createOneWithSeats: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.ADMIN))
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
            updateOne: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.ADMIN))
                .input(BusUpdateOneDto)
                .mutation(({ input }) => {
                    return this.busesService.updateOneBus(input);
                }),
            deleteOne: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.ADMIN))
                .input(BusDeleteOneDto)
                .mutation(({ input }) => {
                    return this.busesService.deleteOne(input);
                }),
            addSeats: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.ADMIN))
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
            getSeatsByIds: this.trpcService
                .publicProcedure()
                .input(BusSeatsGetManyByIdsDto)
                .query(({ input }) => {
                    return this.busesService.getManySeatsByIds(input);
                }),
            searchBus: this.trpcService
                .publicProcedure()
                .input(BusSearchDto)
                .query(({ input }) => {
                    return this.busesService.searchBus(input);
                }),
            findAll: this.trpcService
                .publicProcedure()
                .query(() => {
                    return this.busesService.findAll();
                })
        });
    }
}