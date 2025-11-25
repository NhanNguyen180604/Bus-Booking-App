import { RootConfig } from "../../config/config";
import { LoginProviderEnum } from "../../users/login-providers.enum";
import { UsersService } from "../../users/users.service";
import { Inject, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from 'passport-github';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
    constructor(
        private readonly usersService: UsersService,
        @Inject(RootConfig)
        config: RootConfig,
    ) {
        super({
            clientID: config.oauth2.github.client_id,
            clientSecret: config.oauth2.github.client_secret,
            callbackURL: config.oauth2.github.callback_url,
        });
    }

    async validate(access_token: string, refresh_token: string, profile: Profile, done: (error: any, user?: any, info?: any) => void) {
        const { id, displayName } = profile;

        const foundUser = await this.usersService.findOneBy({
            providerId: id,
            provider: LoginProviderEnum.GITHUB,
        });
        if (foundUser) {
            return done(null, foundUser);
        }

        const newUser = await this.usersService.createOne({
            providerId: id,
            provider: LoginProviderEnum.GITHUB,
            name: displayName,
        });
        return done(null, newUser);
    }
}