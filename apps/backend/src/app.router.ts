import { INestApplication, Injectable } from "@nestjs/common";
import { TrpcService } from "./trpc/trpc.service";
import * as trpcExpress from '@trpc/server/adapters/express';
import { UsersRouter } from "./users/users.router";
import { createContext } from './trpc/trpc.context';
import { JwtMiddleware } from "./middlewares/jwt.middleware";
import { StationsRouter } from "./stations/stations.router";
import { RoutesRouter } from "./routes/routes.router";
import { BusesRouter } from "./buses/buses.router";
import { BusTypesRouter } from "./bus-types/bus-types.router";

@Injectable()
export class AppRouter {
    private appRouter: ReturnType<AppRouter['apply']>;
    constructor(
        private readonly trpcService: TrpcService,
        private readonly usersRouter: UsersRouter,
        private readonly stationsRouter: StationsRouter,
        private readonly routesRouter: RoutesRouter,
        private readonly busesRouter: BusesRouter,
        private readonly busTypesRouter: BusTypesRouter,
    ) {
        this.appRouter = this.apply();
    }

    apply() {
        return this.trpcService.router({
            users: this.usersRouter.apply(),
            stations: this.stationsRouter.apply(),
            routes: this.routesRouter.apply(),
            buses: this.busesRouter.apply(),
            busTypes: this.busTypesRouter.apply(),
        });
    }

    async applyMiddleware(app: INestApplication) {
        const jwtMiddleware = app.get(JwtMiddleware);
        app.use('/trpc', jwtMiddleware.use.bind(jwtMiddleware));
        app.use(
            `/trpc`,
            trpcExpress.createExpressMiddleware({
                router: this.appRouter,
                createContext,
            }),
        );
    }
}

export type AppRouterType = ReturnType<AppRouter['apply']>;