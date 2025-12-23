import { z } from 'zod';
import { PaginationDto } from './common';

export const CreateReviewDto = z.object({
    tripId: z.uuid(),
    bookingId: z.uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(1).max(1000),
});

export type CreateReviewDtoType = z.infer<typeof CreateReviewDto>;

export const UpdateReviewDto = z.object({
    reviewId: z.uuid(),
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().min(1).max(1000).optional(),
});

export type UpdateReviewDtoType = z.infer<typeof UpdateReviewDto>;

export const DeleteReviewDto = z.object({
    reviewId: z.uuid(),
});

export type DeleteReviewDtoType = z.infer<typeof DeleteReviewDto>;

export const GetReviewsByTripDto = z.object({
    routeId: z.uuid(),
    sortBy: z.enum(['createdAt', 'rating']).optional().default('createdAt'),
    sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),
    rating: z.number().int().min(1).max(5).optional(),
}).extend(PaginationDto.shape);

export type GetReviewsByTripDtoType = z.infer<typeof GetReviewsByTripDto>;

export const CheckUserReviewDto = z.object({
    bookingId: z.uuid(),
});

export type CheckUserReviewDtoType = z.infer<typeof CheckUserReviewDto>;
