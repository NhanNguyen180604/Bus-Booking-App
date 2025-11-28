import { UsersService } from "../../users/users.service";
import { Inject, Injectable } from "@nestjs/common";
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { PassportStrategy } from '@nestjs/passport';
import { RootConfig } from "../../config/config";
import { LoginProviderEnum } from "../../entities/users.entity";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
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

        const foundUser = await this.usersService.findOneBy({
            providerId: id,
            provider: LoginProviderEnum.GOOGLE,
        });
        if (foundUser) {
            return done(null, foundUser);
        }

        const newUser = await this.usersService.createOne({
            providerId: id,
            provider: LoginProviderEnum.GOOGLE,
            name: name?.givenName + ' ' + name?.familyName,
        });
        return done(null, newUser);
    }
} 