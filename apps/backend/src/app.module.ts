import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrpcModule } from './trpc/trpc.module';
import { UsersModule } from './users/users.module';
import { AppRouter } from './app.router';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dotenvLoader, fileLoader, TypedConfigModule } from 'nest-typed-config';
import { RootConfig } from './config/config';
import { CustomJwtModule } from './jwt/custom-jwt.module';
import { JwtMiddleware } from './middlewares/jwt.middleware';
import { User } from './users/users.entity';
import { TokenModule } from './token/token.module';
import { RefreshToken } from './token/refresh-token.entity';
import { Oauth2Module } from './google/oauth2.module';

// TODO: actually set as production mode
const loader = process.env.NODE_ENV === 'production' ?
  dotenvLoader({
    separator: '__',
    envFilePath: '.env',
  }) : fileLoader({
    basename: '.env.development',
  });

@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: RootConfig,
      load: loader,
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [RootConfig],
      useFactory: (config: RootConfig) => ({
        type: 'postgres',
        url: config.database.url,
        entities: [
          User,
          RefreshToken,
        ],
        synchronize: true,
      }),
    }),
    CustomJwtModule,
    TrpcModule,
    UsersModule,
    TokenModule,
    Oauth2Module
  ],
  controllers: [AppController],
  providers: [AppService, AppRouter, JwtMiddleware],
})
export class AppModule {
}
