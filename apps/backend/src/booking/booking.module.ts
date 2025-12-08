import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingRouter } from './booking.router';
import { TrpcModule } from 'src/trpc/trpc.module';
import { CustomJwtModule } from 'src/jwt/custom-jwt.module';

@Module({
  imports: [
    TrpcModule,
    CustomJwtModule,
  ],
  providers: [BookingService, BookingRouter],
  exports: [BookingService, BookingRouter],
})
export class BookingModule { }
