import { Injectable, Logger } from "@nestjs/common";
import { TrpcService } from "../trpc/trpc.service";
import { UserRoleEnum } from "@repo/shared";
import { TripAdminSearchDto, TripCreateOneDto, TripDeleteOneDto, TripFindManyDto, TripFindOneByIdDto, TripUpdateOneDto, RelatedTripsDto } from "@repo/shared";
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
            createOne: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.ADMIN))
                .input(TripCreateOneDto)
                .mutation(({ input }) => {
                    return this.tripsService.createOne(input);
                }),
            updateOne: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.ADMIN, UserRoleEnum.DRIVER))
                .input(TripUpdateOneDto)
                .mutation(({ input, ctx }) => {
                    const user = ctx.user!;
                    return this.tripsService.updateOne(input, user);
                }),
            deleteOne: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.ADMIN))
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
            adminSearch: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.ADMIN))
                .input(TripAdminSearchDto)
                .query(({ input }) => {
                    return this.tripsService.adminSearch(input);
                }),
            relatedTrips: this.trpcService
                .publicProcedure()
                .input(RelatedTripsDto)
                .query(({ input }) => {
                    return this.tripsService.getRelatedTrips(input);
                }),
            driverFindOneTripById: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.DRIVER))
                .input(TripFindOneByIdDto)
                .query(({ input, ctx }) => {
                    const { user: driver } = ctx;
                    return this.tripsService.driverFindOneById(input, driver!);
                }),
        });
    }
}