import { Module } from '@nestjs/common';
import { Oauth2Service } from './oauth2.service';
import { Oauth2Controller } from './oauth2.controller';
import { TokenModule } from '../token/token.module';
import { GoogleStrategy } from './passport-strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import { FacebookStrategy } from './passport-strategies/facebook.strategy';
import { GitHubStrategy } from './passport-strategies/github.strategy';

@Module({
  imports: [TokenModule, UsersModule],
  providers: [Oauth2Service, GoogleStrategy, FacebookStrategy, GitHubStrategy],
  controllers: [Oauth2Controller]
})
export class Oauth2Module { }
