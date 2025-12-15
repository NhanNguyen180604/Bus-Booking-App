import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Booking } from 'src/entities/booking.entity';
import { MyMailerService } from 'src/my-mailer/my-mailer.service';
import { EntityManager } from 'typeorm';
import { Notification, NotificationTypeEnum } from 'src/entities/notification.entity';
import { TripStatusEnum } from '@repo/shared';

@Injectable()
export class TasksService {
    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
        private readonly mailerService: MyMailerService,
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
                .leftJoinAndSelect('booking.trip', 'trip')
                .leftJoinAndSelect('trip.route', 'route')
                .leftJoinAndSelect('route.origin', 'origin')
                .leftJoinAndSelect('route.destination', 'destination')
                .where('trip.departureTime >= :start', { start: startOfTomorrowUTC })
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
                .leftJoinAndSelect('booking.trip', 'trip')
                .leftJoinAndSelect('trip.route', 'route')
                .leftJoinAndSelect('route.origin', 'origin')
                .leftJoinAndSelect('route.destination', 'destination')
                .where('trip.arrivalTime >= :start', { start: startOfTodayUTC })
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
}
