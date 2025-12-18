import { Injectable, Logger } from '@nestjs/common';
import { TrpcService } from 'src/trpc/trpc.service';
import { PaymentsService } from './payments.service';
import { UserRoleEnum } from 'src/entities/users.entity';
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
            search: this.trpcService
                .roleGuardProcedure(UserRoleEnum.ADMIN)
                .input(PaymentSearchDto)
                .query(({ input }) => {
                    return this.paymentsService.searchPayments(input);
                }),
        });
    }
}
