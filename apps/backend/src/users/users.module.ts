import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TrpcModule } from '@backend/trpc/trpc.module';
import { UsersRouter } from './users.router';

@Module({
  imports: [TrpcModule],
  providers: [UsersService, UsersRouter],
  exports: [UsersRouter],
})
export class UsersModule { }
