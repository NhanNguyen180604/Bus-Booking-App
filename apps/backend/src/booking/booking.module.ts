import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingRouter } from './booking.router';
import { TrpcModule } from 'src/trpc/trpc.module';
import { CustomJwtModule } from 'src/jwt/custom-jwt.module';
import { MyMailerModule } from 'src/my-mailer/my-mailer.module';
import { StripeModule } from 'src/stripe/stripe.module';

@Module({
  imports: [
    TrpcModule,
    CustomJwtModule,
    StripeModule,
  ],
  providers: [BookingService, BookingRouter],
  exports: [BookingService, BookingRouter],
})
export class BookingModule { }
