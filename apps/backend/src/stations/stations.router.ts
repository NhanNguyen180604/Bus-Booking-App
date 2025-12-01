import { Injectable, Logger } from "@nestjs/common";
import { TrpcService } from "../trpc/trpc.service";
import { StationsService } from "./stations.service";
import { UserRoleEnum } from "../entities/users.entity";
import { StationCreateDto, StationDeleteDto, StationFindOneDto, StationUpdateOneDto } from "@repo/shared";

@Injectable()
export class StationsRouter {
    constructor(
        private readonly trpcService: TrpcService,
        private readonly stationsService: StationsService,
    ) { }

    apply() {
        Logger.log('Initialized paths /trpc/stations', 'StationsRouter');
        return this.trpcService.router({
            createOne: this.trpcService
                .roleGuardProcedure(UserRoleEnum.ADMIN)
                .input(StationCreateDto)
                .mutation(({ input }) => {
                    return this.stationsService.createOne(input);
                }),
            deleteOne: this.trpcService
                .roleGuardProcedure(UserRoleEnum.ADMIN)
                .input(StationDeleteDto)
                .mutation(({ input }) => {
                    return this.stationsService.deleteOne(input);
                }),
            findOne: this.trpcService
                .roleGuardProcedure(UserRoleEnum.ADMIN)
                .input(StationFindOneDto)
                .query(({ input }) => {
                    return this.stationsService.findOne(input);
                }),
            updateOne: this.trpcService
                .roleGuardProcedure(UserRoleEnum.ADMIN)
                .input(StationUpdateOneDto)
                .mutation(({ input }) => {
                    return this.stationsService.updateOne(input);
                }),
        });
    }
}