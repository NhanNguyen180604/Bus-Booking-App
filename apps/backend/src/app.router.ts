import { INestApplication, Injectable } from "@nestjs/common";
import { TrpcService } from "./trpc/trpc.service";
import * as trpcExpress from '@trpc/server/adapters/express';
import { UsersRouter } from "./users/users.router";
import { createContext } from './trpc/trpc.context';
import { JwtMiddleware } from "./middlewares/jwt.middleware";

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

export type AppRouterType = AppRouter['appRouter'];