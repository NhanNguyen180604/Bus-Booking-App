import { UsersService } from "@backend/users/users.service";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { PassportStrategy } from '@nestjs/passport';
import { RootConfig } from "@backend/config/config";
import { LoginProviderEnum } from "@backend/users/login-providers.enum";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        @Inject(UsersService)
        private readonly usersService: UsersService,
        @Inject(RootConfig)
        config: RootConfig,
    ) {
        super({
            clientID: config.oauth2.google.client_id,
            clientSecret: config.oauth2.google.client_secret,
            callbackURL: config.oauth2.google.callback_url,
            scope: ['email', 'profile'],
        },);
    }

    async validate(access_token: string, refresh_token: string, profile: Profile, done: VerifyCallback) {
        const { id, name } = profile;

        const foundUser = await this.usersService.findOneBy2({
            providerId: id,
            provider: LoginProviderEnum.GOOGLE,
        });
        if (foundUser) {
            Logger.log(foundUser);
            return done(null, foundUser);
        }

        const newUser = await this.usersService.createOne({
            providerId: id,
            provider: LoginProviderEnum.GOOGLE,
            name: name?.givenName + ' ' + name?.givenName,
        });
        return done(null, newUser);
    }
} 