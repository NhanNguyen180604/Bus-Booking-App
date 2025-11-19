import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrpcModule } from './trpc/trpc.module';
import { UsersModule } from './users/users.module';
import { AppRouter } from './app.router';
import { TypeOrmModule } from '@nestjs/typeorm';
import { fileLoader, TypedConfigModule } from 'nest-typed-config';
import { RootConfig } from './config/config';

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
        entities: [],
        synchronize: true,
      }),
    }),
    TrpcModule,
    UsersModule
  ],
  controllers: [AppController],
  providers: [AppService, AppRouter],
})
export class AppModule { }
