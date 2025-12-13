import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { StripeModule } from 'src/stripe/stripe.module';
import { BookingModule } from 'src/booking/booking.module';
import { MyMailerModule } from 'src/my-mailer/my-mailer.module';

@Module({
  imports: [
    StripeModule,
    BookingModule,
    MyMailerModule,
  ],
  controllers: [WebhooksController],
})
export class WebhooksModule { }
