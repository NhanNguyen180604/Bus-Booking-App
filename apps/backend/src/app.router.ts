import { INestApplication, Injectable } from "@nestjs/common";
import { TrpcService } from "./trpc/trpc.service";
import * as trpcExpress from '@trpc/server/adapters/express';
import { UsersRouter } from "./users/users.router";

@Injectable()
export class AppRouter {
    private appRouter: ReturnType<AppRouter['apply']>;
    constructor(
        private readonly trpcService: TrpcService,
        private readonly usersRouter: UsersRouter,
    ) {
        this.appRouter = this.apply();
    }

    apply() {
        return this.trpcService.router({
            users: this.usersRouter.apply()
        });
    }

    async applyMiddleware(app: INestApplication) {
        app.use(
            `/trpc`,
            trpcExpress.createExpressMiddleware({
                router: this.appRouter,
            }),
        );
    }
}

export type AppRouterType = AppRouter['appRouter'];