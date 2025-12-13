import { Inject, Injectable } from '@nestjs/common';
import { RootConfig } from 'src/config/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
    stripe: Stripe;

    constructor(
        @Inject(RootConfig)
        private readonly config: RootConfig,
    ) {
        this.stripe = new Stripe(this.config.stripe.secret);
    }
}
