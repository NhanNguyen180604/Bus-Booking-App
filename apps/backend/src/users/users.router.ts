import { TrpcService } from "@backend/trpc/trpc.service";
import { Injectable } from "@nestjs/common";
import { UserLoginDto } from "./dtos/login.dto";
import { UsersService } from "./users.service";

@Injectable()
export class UsersRouter {
    constructor(
        private readonly trpcService: TrpcService,
        private readonly usersService: UsersService,
    ) { }

    apply() {
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