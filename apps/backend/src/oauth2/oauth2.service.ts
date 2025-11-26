import { TokenService } from '../token/token.service';
import { User } from '../users/users.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class Oauth2Service {
    constructor(
        private readonly tokenService: TokenService,
    ) { }

    async oauth2Login(user: User) {
        const access_token = await this.tokenService.createOneAccessToken(user);
        const refresh_token = await this.tokenService.createOneRefreshToken(user);
        return { access_token, refresh_token };
    }
}
