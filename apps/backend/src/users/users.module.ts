import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TrpcModule } from '../trpc/trpc.module';
import { UsersRouter } from './users.router';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/users.entity';
import { TokenModule } from '../token/token.module';
import { MyMailerModule } from 'src/my-mailer/my-mailer.module';
import { ResetPasswordToken } from 'src/entities/reset-password-token.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    TrpcModule,
    TypeOrmModule.forFeature([User, ResetPasswordToken]),
    forwardRef(() => TokenModule),
    MyMailerModule,
    CloudinaryModule,
  ],
  providers: [UsersService, UsersRouter],
  exports: [UsersRouter, UsersService],
})
export class UsersModule { }
