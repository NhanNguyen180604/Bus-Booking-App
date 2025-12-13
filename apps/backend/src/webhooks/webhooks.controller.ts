import { Controller, Headers, HttpCode, Inject, Logger, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { BookingService } from 'src/booking/booking.service';
import { RootConfig } from 'src/config/config';
import { MyMailerService } from 'src/my-mailer/my-mailer.service';
import { StripeService } from 'src/stripe/stripe.service';

@Controller('webhooks')
export class WebhooksController {
    private readonly logger: Logger = new Logger(WebhooksController.name);

    constructor(
        private readonly bookingService: BookingService,
        @Inject(RootConfig)
        private readonly config: RootConfig,
        private readonly stripeService: StripeService,
        private readonly mailerService: MyMailerService,
    ) { }

    @Post('stripe')
    @HttpCode(200)
    async handleStripeWebhook(@Req() req: Request, @Res() res: Response, @Headers("stripe-signature") signature: string) {
        const webhookSecret = this.config.stripe.webhook_secret;
        const event = await this.stripeService.stripe.webhooks.constructEventAsync(
            req.body as Buffer,
            signature,
            this.config.stripe.webhook_secret,
        );

        switch (event.type) {
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;
                const booking = await this.bookingService.confirmBooking(paymentIntent.id);

                if (booking.email && booking.email.trim().length) {
                    try {
                        await this.mailerService.sendETicket(booking);
                    } catch (error) {
                        this.logger.error(
                            `Failed to send e-ticket for booking ${booking.id}:`,
                            error instanceof Error ? error.message : 'Unknown error'
                        );
                    }
                }

                this.logger.log(`Payment succeeded, transaction ID: ${paymentIntent.id}`);
                break;
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object;
                this.logger.log(`Payment failed, transaction ID: ${paymentIntent.id}`);
                break;
            }
            default:
                this.logger.log("Unhandled stripe event type: " + event.type);
        }
        return { received: true };
    }
}
