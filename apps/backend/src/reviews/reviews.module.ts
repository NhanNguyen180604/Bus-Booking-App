import { Module } from '@nestjs/common';
import { ReviewService } from './reviews.service';
import { TrpcModule } from 'src/trpc/trpc.module';
import { ReviewRouter } from './reviews.router';

@Module({
  imports: [TrpcModule],
  providers: [ReviewService, ReviewRouter],
  exports: [ReviewService, ReviewRouter],
})
export class ReviewModule { }
