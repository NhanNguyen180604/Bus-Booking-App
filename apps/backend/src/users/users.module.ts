import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TrpcModule } from '../trpc/trpc.module';
import { UsersRouter } from './users.router';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/users.entity';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [
    TrpcModule,
    TypeOrmModule.forFeature([User]),
    forwardRef(() => TokenModule),
  ],
  providers: [UsersService, UsersRouter],
  exports: [UsersRouter, UsersService],
})
export class UsersModule { }
