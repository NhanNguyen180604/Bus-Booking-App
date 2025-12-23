import { Injectable, Logger } from '@nestjs/common';
import { TrpcService } from 'src/trpc/trpc.service';
import { ReviewService } from './reviews.service';
import {
    CreateReviewDto,
    UpdateReviewDto,
    DeleteReviewDto,
    GetReviewsByTripDto as GetReviewsByRouteDto,
    CheckUserReviewDto,
} from '@repo/shared';

@Injectable()
export class ReviewRouter {
    constructor(
        private readonly trpcService: TrpcService,
        private readonly reviewService: ReviewService,
    ) { }

    apply() {
        Logger.log('Initialized paths /trpc/reviews', 'ReviewRouter');
        return this.trpcService.router({
            create: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware())
                .input(CreateReviewDto)
                .mutation(({ input, ctx }) => {
                    return this.reviewService.createReview(input, ctx.user!);
                }),
            update: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware())
                .input(UpdateReviewDto)
                .mutation(({ input, ctx }) => {
                    return this.reviewService.updateReview(input, ctx.user!);
                }),
            delete: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware())
                .input(DeleteReviewDto)
                .mutation(({ input, ctx }) => {
                    return this.reviewService.deleteReview(input, ctx.user!);
                }),
            getByRoute: this.trpcService.procedure
                .input(GetReviewsByRouteDto)
                .query(({ input }) => {
                    return this.reviewService.getReviewsByRoute(input);
                }),
            checkUserReview: this.trpcService.procedure
                .use(this.trpcService.roleGuardMiddleware())
                .input(CheckUserReviewDto)
                .query(({ input, ctx }) => {
                    return this.reviewService.checkUserReview(input, ctx.user!);
                }),
        });
    }
}
