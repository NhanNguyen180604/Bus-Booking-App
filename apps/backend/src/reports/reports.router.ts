import { Injectable, Logger } from '@nestjs/common';
import { TrpcService } from 'src/trpc/trpc.service';
import { ReportsService } from './reports.service';
import { UserRoleEnum } from '@repo/shared';

@Injectable()
export class ReportsRouter {
    constructor(
        private readonly trpcService: TrpcService,
        private readonly reportsService: ReportsService,
    ) { }

    apply() {
        Logger.log('Initialized paths /trpc/reports', 'ReportsRouter');
        return this.trpcService.router({
            getOverview: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.ADMIN))
                .query(() => {
                    return this.reportsService.getOverview();
                }),
            getTodayRevenue: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.ADMIN))
                .query(() => {
                    return this.reportsService.getTodayRevenue();
                }),
            getLast30DaysRevenue: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.ADMIN))
                .query(() => {
                    return this.reportsService.getLast30DaysRevenue();
                }),
            getLast30DaysBookings: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.ADMIN))
                .query(() => {
                    return this.reportsService.getLast30DaysBookings();
                }),
            getTopRoutes: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.ADMIN))
                .query(() => {
                    return this.reportsService.getTopRoutes(5);
                }),
            getDailyRevenue: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware(UserRoleEnum.ADMIN))
                .query(() => {
                    return this.reportsService.getDailyRevenue();
                }),
        });
    }
}
