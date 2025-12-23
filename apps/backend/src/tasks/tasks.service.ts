import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Timeout } from '@nestjs/schedule';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Booking } from 'src/entities/booking.entity';
import { MyMailerService } from 'src/my-mailer/my-mailer.service';
import { EntityManager } from 'typeorm';
import { Notification, NotificationTypeEnum } from 'src/entities/notification.entity';
import { PaymentProviderEnum, PaymentStatusEnum, TripStatusEnum } from '@repo/shared';
import { StripeService } from 'src/stripe/stripe.service';
import { Payment } from 'src/entities/payment.entity';
import { ResetPasswordToken } from 'src/entities/reset-password-token.entity';

@Injectable()
export class TasksService {
    logger: Logger = new Logger(TasksService.name);

    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
        private readonly mailerService: MyMailerService,
        private readonly stripeService: StripeService,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_7AM)
    sendUpcomingTripNofitications() {
        this.entityManager.transaction(async (transactionalEntityManager) => {
            const now = new Date();
            const startOfTomorrowUTC = new Date(Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate() + 1,
                0, 0, 0, 0
            ));
            const startOf3DaysLaterUTC = new Date(Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate() + 3,
                0, 0, 0, 0
            ));

            const noNotiBookings = await transactionalEntityManager
                .getRepository(Booking)
                .createQueryBuilder('booking')
                .leftJoin(Notification, 'notification', '(booking.id = notification.bookingId) AND (notification.type = :type)'
                    , { type: NotificationTypeEnum.UPCOMING_TRIP_REMINDER })
                .leftJoin('booking.payment', 'payment')
                .leftJoinAndSelect('booking.trip', 'trip')
                .leftJoinAndSelect('trip.route', 'route')
                .leftJoinAndSelect('route.origin', 'origin')
                .leftJoinAndSelect('route.destination', 'destination')
                .where("payment.status = :status", { status: PaymentStatusEnum.COMPLETED })
                .andWhere('trip.departureTime >= :start', { start: startOfTomorrowUTC })
                .andWhere('trip.departureTime < :end', { end: startOf3DaysLaterUTC })
                .andWhere('notification.id IS NULL')
                .getMany();

            const newNotifications = [] as Notification[];
            for (const booking of noNotiBookings) {
                if (!booking.email || !booking.email.trim().length)
                    continue;

                const mailBody = `Your trip from ${booking.trip.route.origin.name} to ${booking.trip.route.destination.name} will depart soon on ${booking.trip.departureTime.toLocaleString()}. Please arrive at least 15 minutes early for check-in.`
                const newNotification = transactionalEntityManager
                    .getRepository(Notification)
                    .create({
                        booking,
                        message: mailBody,
                        type: NotificationTypeEnum.UPCOMING_TRIP_REMINDER,
                    });

                await this.mailerService.sendGenericMail({
                    to: booking.email,
                    subject: 'Upcoming Trip Reminder',
                    template: 'minimal',
                    context: {
                        headline: `Hi ${booking.fullName},`,
                        body: mailBody,
                        footer: 'Best regards, BusBus.',
                    },
                });

                newNotifications.push(newNotification);
            }

            await transactionalEntityManager.save(newNotifications);
        });
    }

    @Cron(CronExpression.EVERY_DAY_AT_7PM)
    sendPostTripThankyouMails() {
        this.entityManager.transaction(async (transactionalEntityManager) => {
            const now = new Date();
            const startOfTodayUTC = new Date(Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
                0, 0, 0, 0
            ));
            const pm7UTC = new Date(Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
                19, 0, 0, 0
            ));

            const noNotiBookings = await transactionalEntityManager
                .getRepository(Booking)
                .createQueryBuilder('booking')
                .leftJoin(Notification, 'notification', '(booking.id = notification.bookingId) AND (notification.type = :type)'
                    , { type: NotificationTypeEnum.POST_TRIP_THANK_YOU })
                .leftJoin('booking.payment', 'payment')
                .leftJoinAndSelect('booking.trip', 'trip')
                .leftJoinAndSelect('trip.route', 'route')
                .leftJoinAndSelect('route.origin', 'origin')
                .leftJoinAndSelect('route.destination', 'destination')
                .where("payment.status = :status", { status: PaymentStatusEnum.COMPLETED })
                .andWhere('trip.arrivalTime >= :start', { start: startOfTodayUTC })
                .andWhere('trip.arrivalTime <= :end', { end: pm7UTC })
                .andWhere('trip.status = :tripStatus', { tripStatus: TripStatusEnum.ARRIVED })
                .andWhere('notification.id IS NULL')
                .getMany();

            const newNotifications = [] as Notification[];
            for (const booking of noNotiBookings) {
                if (!booking.email || !booking.email.trim().length)
                    continue;

                const mailBody = `Your trip from ${booking.trip.route.origin.name} to ${booking.trip.route.destination.name} has completed. Thank you for using our service.`
                const newNotification = transactionalEntityManager
                    .getRepository(Notification)
                    .create({
                        booking,
                        message: mailBody,
                        type: NotificationTypeEnum.POST_TRIP_THANK_YOU,
                    });

                await this.mailerService.sendGenericMail({
                    to: booking.email,
                    subject: 'Post Trip Gratitude',
                    template: 'minimal',
                    context: {
                        headline: `Hi ${booking.fullName},`,
                        body: mailBody,
                        footer: 'Best regards, BusBus.',
                    },
                });

                newNotifications.push(newNotification);
            }

            await transactionalEntityManager.save(newNotifications);
        });
    }

    @Cron(CronExpression.EVERY_30_MINUTES)
    /**
     * Mark all expired payment as EXPIRED, cancel/refund their stripe PaymentIntent
     */
    clearExpiredPayments() {
        this.entityManager.transaction(async (transactionalEntityManager) => {
            const expiredPayments = await transactionalEntityManager
                .getRepository(Payment)
                .createQueryBuilder('payment')
                .leftJoin(Booking, 'booking', 'booking.paymentId = payment.id')
                .where('booking.expiresAt IS NOT NULL AND booking.expiresAt < NOW()')
                .andWhere("payment.status != :expired AND payment.status != :refunded", {
                    expired: PaymentStatusEnum.EXPIRED,
                    refunded: PaymentStatusEnum.REFUNDED,
                })
                .getMany();

            for (const payment of expiredPayments) {
                // all stripe
                if (payment.paymentProvider === PaymentProviderEnum.STRIPE) {
                    try {
                        const paymentIntent = await this.stripeService.stripe.paymentIntents.retrieve(payment.paymentTransactionId);
                        if (paymentIntent.status == 'succeeded') {
                            await this.stripeService.stripe.refunds.create({
                                payment_intent: paymentIntent.id,
                                reason: 'requested_by_customer',
                            });
                        }
                        else {
                            await this.stripeService.stripe.paymentIntents.cancel(paymentIntent.id, {
                                cancellation_reason: 'abandoned',
                            });
                        }
                        payment.status = PaymentStatusEnum.EXPIRED;
                    }
                    catch (error) {
                        this.logger.error(`Failed to cancel stripe payment intent ${payment.paymentTransactionId}`);
                        this.logger.error(`Reason: ${error.message}`);
                    }
                }
            }

            await transactionalEntityManager.save(expiredPayments);
        });
    }

    @Cron(CronExpression.EVERY_DAY_AT_11PM)
    async deleteResetPasswordToken() {
        await this.entityManager.getRepository(ResetPasswordToken)
            .createQueryBuilder('token')
            .where('token.expiresAt < NOW()')
            .delete()
            .execute();
    }
}
