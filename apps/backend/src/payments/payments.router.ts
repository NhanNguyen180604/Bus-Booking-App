import { Injectable, Logger } from '@nestjs/common';
import { TrpcService } from 'src/trpc/trpc.service';
import { PaymentsService } from './payments.service';
import { UserRoleEnum } from '@repo/shared';
import { PaymentSearchDto } from '@repo/shared';

@Injectable()
export class PaymentsRouter {
    constructor(
        private readonly trpcService: TrpcService,
        private readonly paymentsService: PaymentsService,
    ) { }

    apply() {
        Logger.log('Initialized paths /trpc/payments', 'PaymentsRouter');
        return this.trpcService.router({
            search: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.ADMIN))
                .input(PaymentSearchDto)
                .query(({ input }) => {
                    return this.paymentsService.searchPayments(input);
                }),
        });
    }
}
