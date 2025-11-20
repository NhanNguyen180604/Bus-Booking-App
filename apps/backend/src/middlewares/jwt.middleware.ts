import { TokenService } from "@backend/token/token.service";
import { AccessTokenPayload, RefreshTokenPayload } from "@backend/types/token-payload";
import { UsersService } from "@backend/users/users.service";
import { Inject, Injectable, NestMiddleware } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { type Request, type Response, NextFunction } from "express";

@Injectable()
export class JwtMiddleware implements NestMiddleware {
    constructor(
        @Inject('ACCESS_JWT')
        private readonly accessJwtService: JwtService,
        @Inject('REFRESH_JWT')
        private readonly refreshJwtService: JwtService,
        @Inject(TokenService)
        private readonly tokenService: TokenService,
        @Inject(UsersService)
        private readonly usersService: UsersService,
    ) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const tokenObj = this.tokenService.extractTokensFromCookies(req);
        if (!tokenObj || (!tokenObj.access_token && !tokenObj.refresh_token)) {
            return next();
        }

        if (tokenObj.access_token) {
            const payload = this.accessJwtService.verify<AccessTokenPayload>(tokenObj.access_token);
            const foundUser = await this.usersService.findOneBy("id", payload.sub);
            if (foundUser) {
                req.user = foundUser;
            }
        }
        else if (tokenObj.refresh_token) {
            // check if this token still exists in the database
            const refreshTokenEntity = await this.tokenService.findOneBy("value", tokenObj.refresh_token);
            if (!refreshTokenEntity) {
                res.clearCookie('access_token');
                res.clearCookie('refresh_token');
                return next();
            }

            try {
                const payload = this.refreshJwtService.verify<RefreshTokenPayload>(tokenObj.refresh_token);
                const foundUser = await this.usersService.findOneBy("id", payload.sub);
                if (foundUser) {
                    req.user = foundUser;
                    // create new access token for the user
                    const new_access_token = await this.tokenService.createOneAccessToken(foundUser);
                    res.cookie("access_token", new_access_token);
                }
            }
            catch (error) {
                if (error.name === "TokenExpiredError") {
                    this.tokenService.deleteOneRefreshTokenByValue(tokenObj.refresh_token);
                    return next();
                }
                else throw error;
            }
        }

        return next();
    }
}