import { TrpcService } from "@backend/trpc/trpc.service";
import { Injectable, Logger } from "@nestjs/common";
import { UserLoginDto } from "./users.dto";
import { UsersService } from "./users.service";

@Injectable()
export class UsersRouter {
    constructor(
        private readonly trpcService: TrpcService,
        private readonly usersService: UsersService,
    ) { }

    apply() {
        Logger.log('Initialized paths /trpc/users', 'UsersRouter');
        return this.trpcService.router({
            login: this.trpcService
                .publicProcedure()
                .input(UserLoginDto)
                .mutation(({ input }) => {
                    return this.usersService.login(input);
                }),
        });
    }
}