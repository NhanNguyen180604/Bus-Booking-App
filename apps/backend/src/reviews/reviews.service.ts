import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
    CreateReviewDtoType,
    UpdateReviewDtoType,
    DeleteReviewDtoType,
    GetReviewsByTripDtoType,
    CheckUserReviewDtoType,
    PaymentStatusEnum
} from '@repo/shared';
import { TRPCError } from '@trpc/server';
import { Review } from 'src/entities/review.entity';
import { User } from 'src/entities/users.entity';
import { Booking } from 'src/entities/booking.entity';
import { EntityManager } from 'typeorm';

@Injectable()
export class ReviewService {
    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    async createReview(dto: CreateReviewDtoType, user: User) {
        return this.entityManager.transaction(async (transactionalEntityManager) => {
            // Verify booking exists and belongs to user
            const booking = await transactionalEntityManager
                .getRepository(Booking)
                .findOne({
                    where: { id: dto.bookingId },
                    relations: { trip: true, payment: { user: true } },
                });

            if (!booking) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Booking not found',
                });
            }

            if (booking.payment.user.id !== user.id) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You can only review your own bookings',
                });
            }

            // Check if payment is successful
            if (booking.payment.status !== PaymentStatusEnum.COMPLETED) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'You can only review completed bookings',
                });
            }

            // Check if trip is completed
            const now = new Date();
            if (new Date(booking.trip.arrivalTime) > now) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'You can only review after the trip is completed',
                });
            }

            // Verify trip exists and matches booking
            if (booking.trip.id !== dto.tripId) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Trip ID does not match booking',
                });
            }

            // Check if user already reviewed this booking
            const existingReview = await transactionalEntityManager
                .getRepository(Review)
                .findOne({
                    where: { booking: { id: dto.bookingId } },
                });

            if (existingReview) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'You have already reviewed this booking',
                });
            }

            const review = transactionalEntityManager.getRepository(Review).create({
                trip: { id: dto.tripId },
                user: { id: user.id },
                booking: { id: dto.bookingId },
                rating: dto.rating,
                comment: dto.comment,
            });

            return await transactionalEntityManager.save(review);
        });
    }

    async updateReview(dto: UpdateReviewDtoType, user: User) {
        const review = await this.entityManager
            .getRepository(Review)
            .findOne({
                where: { id: dto.reviewId },
                relations: { user: true },
            });

        if (!review) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Review not found',
            });
        }

        if (review.user.id !== user.id) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'You can only update your own reviews',
            });
        }

        if (dto.rating !== undefined) {
            review.rating = dto.rating;
        }
        if (dto.comment !== undefined) {
            review.comment = dto.comment;
        }

        return await this.entityManager.save(review);
    }

    async deleteReview(dto: DeleteReviewDtoType, user: User) {
        const review = await this.entityManager
            .getRepository(Review)
            .findOne({
                where: { id: dto.reviewId },
                relations: { user: true },
            });

        if (!review) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Review not found',
            });
        }

        if (review.user.id !== user.id) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'You can only delete your own reviews',
            });
        }

        await this.entityManager.remove(review);
        return { success: true };
    }

    async getReviewsByRoute(dto: GetReviewsByTripDtoType) {
        // Get total count and average rating for ALL reviews (unfiltered)
        const allReviewsQuery = this.entityManager
            .getRepository(Review)
            .createQueryBuilder('review')
            .leftJoinAndSelect('review.trip', 'trip')
            .leftJoinAndSelect('trip.route', 'route')
            .where('route.id = :routeId', { routeId: dto.routeId });

        const allReviews = await allReviewsQuery.getMany();
        const totalReviews = allReviews.length;
        const avgRating = totalReviews > 0
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;

        // Get filtered reviews with pagination
        const queryBuilder = this.entityManager
            .getRepository(Review)
            .createQueryBuilder('review')
            .leftJoinAndSelect('review.user', 'user')
            .leftJoinAndSelect('review.trip', 'trip')
            .leftJoinAndSelect('trip.route', 'route')
            .where('route.id = :routeId', { routeId: dto.routeId });

        if (dto.rating) {
            queryBuilder.andWhere('review.rating = :rating', { rating: dto.rating });
        }

        const sortField = dto.sortBy === 'rating' ? 'review.rating' : 'review.createdAt';
        queryBuilder.orderBy(sortField, dto.sortOrder || 'DESC');

        // Count total filtered reviews
        const totalFilteredReviews = await queryBuilder.getCount();

        // Apply pagination
        const page = dto.page || 1;
        const perPage = dto.perPage || 10;
        queryBuilder.skip((page - 1) * perPage).take(perPage);

        const reviews = await queryBuilder.getMany();

        return {
            reviews,
            averageRating: Math.round(avgRating * 10) / 10,
            totalReviews,
            page,
            perPage,
            totalPage: Math.ceil(totalFilteredReviews / perPage),
        };
    }

    async checkUserReview(dto: CheckUserReviewDtoType, user: User) {
        const booking = await this.entityManager
            .getRepository(Booking)
            .findOne({
                where: { id: dto.bookingId },
                relations: { payment: { user: true }, trip: true },
            });

        if (!booking) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Booking not found',
            });
        }

        if (booking.payment.user.id !== user.id) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Not your booking',
            });
        }

        const review = await this.entityManager
            .getRepository(Review)
            .findOne({
                where: { booking: { id: dto.bookingId } },
                relations: { user: true },
            });

        const now = new Date();
        const tripCompleted = new Date(booking.trip.arrivalTime) <= now;
        const paymentSuccessful = booking.payment.status === PaymentStatusEnum.COMPLETED;

        return {
            hasReviewed: !!review,
            canReview: tripCompleted && paymentSuccessful && !review,
            review: review || null,
        };
    }
}
