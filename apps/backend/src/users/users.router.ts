import { TrpcService } from "../trpc/trpc.service";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { UserUpdateProfileDto, UserChangePasswordDto, UserLoginDto, UserRegisterDto, UserSearchDto, UserVerifyEmailDto, UserForgetPasswordDto, UserResetPasswordDto } from "@repo/shared";
import { UsersService } from "./users.service";
import { RootConfig } from "../config/config";
import { CookieOptions, Request, Response } from "express";
import { UserRoleEnum } from "@repo/shared";
import { TRPCError } from "@trpc/server";
import { LoginProviderEnum } from "src/entities/users.entity";
import { TokenService } from "src/token/token.service";

@Injectable()
export class UsersRouter {
    constructor(
        private readonly trpcService: TrpcService,
        private readonly usersService: UsersService,
        private readonly tokenService: TokenService,
        @Inject(RootConfig)
        private readonly config: RootConfig,
    ) { }

    cookieOptions: CookieOptions = {
        signed: true,
        httpOnly: true,
        sameSite: 'none',
        secure: true,
    };

    apply() {
        Logger.log('Initialized paths /trpc/users', 'UsersRouter');
        return this.trpcService.router({
            postLoginLocal: this.trpcService
                .publicProcedure()
                .input(UserLoginDto)
                .mutation(async ({ input, ctx }) => {
                    const req: Request = ctx.req;
                    const res: Response = ctx.res;
                    const { access_token, refresh_token, verified } = await this.usersService.loginLocal(input, req);
                    res.cookie('access_token', access_token, {
                        ...this.cookieOptions,
                        maxAge: this.config.cookie.access_token_max_age,
                    });
                    if (refresh_token) {
                        res.cookie('refresh_token', refresh_token, {
                            ...this.cookieOptions,
                            maxAge: this.config.cookie.refresh_token_max_age,
                        });
                    }
                    return {
                        message: "Login Success",
                        verified,
                    };
                }),
            postRegisterLocal: this.trpcService
                .publicProcedure()
                .input(UserRegisterDto)
                .mutation(async ({ input, ctx }) => {
                    const res: Response = ctx.res;
                    const { access_token, refresh_token } = await this.usersService.registerLocal(input);
                    res.cookie('access_token', access_token, {
                        ...this.cookieOptions,
                        maxAge: this.config.cookie.access_token_max_age,
                    });
                    if (refresh_token) {
                        res.cookie('refresh_token', refresh_token, {
                            ...this.cookieOptions,
                            maxAge: this.config.cookie.refresh_token_max_age,
                        });
                    }
                    return 'Registration success';
                }),
            postLogout: this.trpcService
                .publicProcedure()
                .mutation(async ({ ctx }) => {
                    const { user, req } = ctx;
                    if (user) {
                        const tokenObj = this.tokenService.extractTokensFromCookies(req);
                        if (tokenObj?.refresh_token) await this.tokenService.deleteOneRefreshTokenByValue(tokenObj.refresh_token);
                    }
                    const res: Response = ctx.res;
                    res.clearCookie('access_token', this.cookieOptions);
                    res.clearCookie('refresh_token', this.cookieOptions);
                    return 'Logout success';
                }),
            getMe: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware())
                .query(async ({ ctx }) => {
                    const user = ctx.user!;
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        phone: user.phone,
                        provider: user.provider,
                        role: user.role,
                        verified: user.verified,
                    }
                }),
            search: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware())
                .input(UserSearchDto)
                .query(({ input }) => {
                    return this.usersService.search(input);
                }),
            verifyEmail: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.USER))
                .input(UserVerifyEmailDto)
                .query(({ input, ctx }) => {
                    const { user } = ctx;
                    if (user?.verified) {
                        throw new TRPCError({
                            code: "FORBIDDEN",
                            message: "You are already verified",
                        });
                    }
                    return this.usersService.verifyEmail(user!, input.token);
                }),
            requestEmailVerification: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.USER))
                .mutation(({ ctx }) => {
                    const { user } = ctx;
                    if (user?.verified) {
                        throw new TRPCError({
                            code: "FORBIDDEN",
                            message: "You are already verified",
                        });
                    }
                    return this.usersService.sendEmailVerification(user!);
                }),
            getAllDriversWithNoBus: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.ADMIN))
                .query(() => {
                    return this.usersService.getAllDriversWithNoBus();
                }),
            changePassword: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware())
                .input(UserChangePasswordDto)
                .mutation(async ({ input, ctx }) => {
                    const { user, req, res } = ctx;
                    if (!user!.provider.includes(LoginProviderEnum.LOCAL)) {
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message: "You cannot reset password if you have none",
                        });
                    }
                    await this.usersService.changePassword(input, user!);
                    res.clearCookie('access_token', this.cookieOptions);
                    res.clearCookie('refresh_token', this.cookieOptions);
                }),
            updateProfile: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware())
                .input(UserUpdateProfileDto)
                .mutation(async ({ input, ctx }) => {
                    const user = ctx.user!;
                    const newUser = await this.usersService.updateProfile(input, user);
                    return {
                        id: newUser.id,
                        email: newUser.email,
                        name: newUser.name,
                        phone: newUser.phone,
                        provider: newUser.provider,
                        role: newUser.role,
                        verified: newUser.verified,
                    };
                }),
            postForgetPassword: this.trpcService
                .publicProcedure()
                .input(UserForgetPasswordDto)
                .mutation(({ input }) => {
                    return this.usersService.sendResetPasswordEmail(input);
                }),
            resetPassword: this.trpcService
                .publicProcedure()
                .input(UserResetPasswordDto)
                .mutation(({ input }) => {
                    return this.usersService.resetPassword(input);
                }),
        });
    }
}