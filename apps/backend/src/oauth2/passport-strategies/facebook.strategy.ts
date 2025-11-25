import { RootConfig } from "../../config/config";
import { LoginProviderEnum } from "../../users/login-providers.enum";
import { UsersService } from "../../users/users.service";
import { Inject, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor(
        private readonly usersService: UsersService,
        @Inject(RootConfig)
        config: RootConfig,
    ) {
        super({
            clientID: config.oauth2.facebook.client_id,
            clientSecret: config.oauth2.facebook.client_secret,
            callbackURL: config.oauth2.facebook.callback_url,
            profileFields: ['id', 'name'],
        });
    }

    async validate(access_token: string, refresh_token: string, profile: Profile, done: (error: any, user?: any, info?: any) => void) {
        const { id, name } = profile;

        const foundUser = await this.usersService.findOneBy({
            providerId: id,
            provider: LoginProviderEnum.FACEBOOK,
        });
        if (foundUser) {
            return done(null, foundUser);
        }

        const newUser = await this.usersService.createOne({
            providerId: id,
            provider: LoginProviderEnum.FACEBOOK,
            name: name?.givenName + ' ' + name?.familyName,
        });
        return done(null, newUser);
    }
}