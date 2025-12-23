import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Booking } from 'src/entities/booking.entity';
import { PaymentStatusEnum } from '@repo/shared';

@Injectable()
export class ReportsService {
    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    async getTodayRevenue() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const result = await this.entityManager
            .getRepository(Booking)
            .createQueryBuilder('booking')
            .leftJoin('booking.payment', 'payment')
            .select('COALESCE(SUM(booking.totalPrice), 0)', 'total')
            .where('payment.status = :status', { status: PaymentStatusEnum.COMPLETED })
            .andWhere('booking.createdAt >= :today', { today })
            .andWhere('booking.createdAt < :tomorrow', { tomorrow })
            .getRawOne();

        return parseFloat(result.total) || 0;
    }

    async getLast30DaysRevenue() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const result = await this.entityManager
            .getRepository(Booking)
            .createQueryBuilder('booking')
            .leftJoin('booking.payment', 'payment')
            .select('COALESCE(SUM(booking.totalPrice), 0)', 'total')
            .where('payment.status = :status', { status: PaymentStatusEnum.COMPLETED })
            .andWhere('booking.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
            .getRawOne();

        return parseFloat(result.total) || 0;
    }

    async getLast30DaysBookings() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const result = await this.entityManager
            .getRepository(Booking)
            .createQueryBuilder('booking')
            .leftJoin('booking.payment', 'payment')
            .select('COUNT(booking.id)', 'count')
            .where('payment.status = :status', { status: PaymentStatusEnum.COMPLETED })
            .andWhere('booking.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
            .getRawOne();

        return parseInt(result.count) || 0;
    }

    async getTopRoutes(limit: number = 5) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const results = await this.entityManager
            .getRepository(Booking)
            .createQueryBuilder('booking')
            .leftJoin('booking.trip', 'trip')
            .leftJoin('trip.route', 'route')
            .leftJoin('route.origin', 'origin')
            .leftJoin('route.destination', 'destination')
            .leftJoin('booking.payment', 'payment')
            .select('origin.name', 'originName')
            .addSelect('destination.name', 'destinationName')
            .addSelect('COALESCE(SUM(booking.totalPrice), 0)', 'revenue')
            .where('payment.status = :status', { status: PaymentStatusEnum.COMPLETED })
            .andWhere('booking.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
            .groupBy('origin.name')
            .addGroupBy('destination.name')
            .orderBy('revenue', 'DESC')
            .limit(limit)
            .getRawMany();

        return results.map(result => ({
            id: result.id,
            start: result.originName,
            destination: result.destinationName,
            revenue: parseFloat(result.revenue) || 0,
        }));
    }

    async getDailyRevenue() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const results = await this.entityManager
            .getRepository(Booking)
            .createQueryBuilder('booking')
            .leftJoin('booking.payment', 'payment')
            .select('DATE(booking.createdAt)', 'date')
            .addSelect('COALESCE(SUM(booking.totalPrice), 0)', 'revenue')
            .where('payment.status = :status', { status: PaymentStatusEnum.COMPLETED })
            .andWhere('booking.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
            .groupBy('DATE(booking.createdAt)')
            .orderBy('date', 'ASC')
            .getRawMany();

        return results.map(result => ({
            date: result.date,
            revenue: parseFloat(result.revenue) || 0,
        }));
    }

    async getOverview() {
        const [todayRevenue, last30DaysRevenue, last30DaysBookings, topRoutes, dailyRevenue] = await Promise.all([
            this.getTodayRevenue(),
            this.getLast30DaysRevenue(),
            this.getLast30DaysBookings(),
            this.getTopRoutes(5),
            this.getDailyRevenue(),
        ]);

        return {
            todayRevenue,
            last30DaysRevenue,
            last30DaysBookings,
            topRoutes,
            dailyRevenue,
        };
    }
}
