import { Injectable, Logger } from "@nestjs/common";
import { TrpcService } from "../trpc/trpc.service";
import { RoutesService } from "./routes.service";
import { UserRoleEnum } from "../entities/users.entity";
import { RouteCreateOneDto, RouteDeleteOneDto, RouteFindOneByIdDto, RouteSearchDto, RouteUpdateOneDto } from "@repo/shared";

@Injectable()
export class RoutesRouter {
    constructor(
        private readonly trpcService: TrpcService,
        private readonly routesService: RoutesService,
    ) { }

    apply() {
        Logger.log('Initialized paths /trpc/routes', 'RoutesRouter');
        return this.trpcService.router({
            createOne: this.trpcService
                .roleGuardProcedure(UserRoleEnum.ADMIN)
                .input(RouteCreateOneDto)
                .mutation(({ input }) => {
                    return this.routesService.createOne(input);
                }),
            updateOne: this.trpcService
                .roleGuardProcedure(UserRoleEnum.ADMIN)
                .input(RouteUpdateOneDto)
                .mutation(({ input }) => {
                    return this.routesService.updateOne(input);
                }),
            deleteOne: this.trpcService
                .roleGuardProcedure(UserRoleEnum.ADMIN)
                .input(RouteDeleteOneDto)
                .mutation(({ input }) => {
                    return this.routesService.deleteOne(input);
                }),
            findOneById: this.trpcService
                .publicProcedure()
                .input(RouteFindOneByIdDto)
                .query(({ input }) => {
                    return this.routesService.findOneByid(input);
                }),
            search: this.trpcService
                .publicProcedure()
                .input(RouteSearchDto)
                .query(({ input }) => {
                    return this.routesService.search(input);
                }),
        });
    }
}