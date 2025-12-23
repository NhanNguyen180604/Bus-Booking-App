import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsRouter } from './payments.router';
import { TrpcModule } from 'src/trpc/trpc.module';

@Module({
    imports: [TrpcModule],
    providers: [PaymentsService, PaymentsRouter],
    exports: [PaymentsRouter],
})
export class PaymentsModule { }
