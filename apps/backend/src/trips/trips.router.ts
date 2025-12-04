import { Injectable, Logger } from "@nestjs/common";
import { TrpcService } from "../trpc/trpc.service";
import { UserRoleEnum } from "../entities/users.entity";
import { TripAdminSearchDto, TripCreateOneDto, TripDeleteOneDto, TripFindManyDto, TripFindOneByIdDto, TripUpdateOneDto } from "@repo/shared";
import { TripsService } from "./trips.service";

@Injectable()
export class TripsRouter {
    constructor(
        private readonly trpcService: TrpcService,
        private readonly tripsService: TripsService,
    ) { }

    apply() {
        Logger.log('Initialized paths /trpc/trips', 'TripsRouter');
        return this.trpcService.router({
            createOne: this.trpcService
                .roleGuardProcedure(UserRoleEnum.ADMIN)
                .input(TripCreateOneDto)
                .mutation(({ input }) => {
                    return this.tripsService.createOne(input);
                }),
            updateOne: this.trpcService
                .roleGuardProcedure(UserRoleEnum.ADMIN)
                .input(TripUpdateOneDto)
                .mutation(({ input }) => {
                    return this.tripsService.updateOne(input);
                }),
            deleteOne: this.trpcService
                .roleGuardProcedure(UserRoleEnum.ADMIN)
                .input(TripDeleteOneDto)
                .mutation(({ input }) => {
                    return this.tripsService.deleteOne(input);
                }),
            findOneById: this.trpcService
                .publicProcedure()
                .input(TripFindOneByIdDto)
                .query(({ input }) => {
                    return this.tripsService.findOneHelper({
                        where: { id: input.id },
                        relations: { route: { origin: true, destination: true }, bus: { type: true, driver: true } }
                    });
                }),
            search: this.trpcService
                .publicProcedure()
                .input(TripFindManyDto)
                .query(({ input }) => {
                    return this.tripsService.findMany(input);
                }),
            adminSearch: this.trpcService
                .roleGuardProcedure(UserRoleEnum.ADMIN)
                .input(TripAdminSearchDto)
                .query(({ input }) => {
                    return this.tripsService.adminSearch(input);
                }),
        });
    }
}