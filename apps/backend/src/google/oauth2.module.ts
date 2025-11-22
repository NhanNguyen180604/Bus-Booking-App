import { Module } from '@nestjs/common';
import { Oauth2Service } from './oauth2.service';
import { Oauth2Controller } from './oauth2.controller';
import { TokenModule } from '@backend/token/token.module';
import { GoogleStrategy } from './passport-strategies/google.strategy';
import { UsersModule } from '@backend/users/users.module';

@Module({
  imports: [TokenModule, UsersModule],
  providers: [Oauth2Service, GoogleStrategy],
  controllers: [Oauth2Controller]
})
export class Oauth2Module { }
