import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrpcModule } from './trpc/trpc.module';
import { UsersModule } from './users/users.module';
import { AppRouter } from './app.router';
import { TypeOrmModule } from '@nestjs/typeorm';
import { fileLoader, TypedConfigModule } from 'nest-typed-config';
import { RootConfig } from './config/config';
import { CustomJwtModule } from './jwt/custom-jwt.module';
import { JwtMiddleware } from './middlewares/jwt.middleware';
import { User } from './users/users.entity';
import { TokenModule } from './token/token.module';
import { RefreshToken } from './token/refresh-token.entity';

@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: RootConfig,
      load: fileLoader({
        basename: '.env.development',
      }),
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
    TokenModule
  ],
  controllers: [AppController],
  providers: [AppService, AppRouter, JwtMiddleware],
})
export class AppModule {
}
