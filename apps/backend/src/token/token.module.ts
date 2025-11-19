import { forwardRef, Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './refresh-token.entity';
import { UsersModule } from '../users/users.module';
import { CustomJwtModule } from '../jwt/custom-jwt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    forwardRef(() => UsersModule),
    CustomJwtModule,
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule { }
