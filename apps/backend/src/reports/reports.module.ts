import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsRouter } from './reports.router';
import { TrpcModule } from 'src/trpc/trpc.module';

@Module({
    imports: [TrpcModule],
    providers: [ReportsService, ReportsRouter],
    exports: [ReportsRouter],
})
export class ReportsModule { }
