import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { BookingCancelDtoType, BookingConfirmDtoType, BookingCreateOneDtoType, BookingLookUpDtoType, BookingUserSearchDtoType, GetBookingSeatsByTripDtoType, PaymentStatusEnum } from '@repo/shared';
import { TRPCError } from '@trpc/server';
import { Booking } from 'src/entities/booking.entity';
import { Payment } from 'src/entities/payment.entity';
import { Seat } from 'src/entities/seat.entity';
import { Trip } from 'src/entities/trip.entity';
import { User } from 'src/entities/users.entity';
import { convertToMs } from 'src/utils/convert-to-ms';
import { MyMailerService } from 'src/my-mailer/my-mailer.service';
import { EntityManager } from 'typeorm';
import crypto from 'crypto';

@Injectable()
export class BookingService {
    private readonly logger = new Logger(BookingService.name);

    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
        private readonly mailerService: MyMailerService,
    ) { }

    createOne(dto: BookingCreateOneDtoType, user?: User) {
        return this.entityManager.transaction(async (transactionalEntityManager) => {
            const trip = await transactionalEntityManager
                .getRepository(Trip)
                .findOneOrFail({ where: { id: dto.tripId }, relations: { bus: true } });
            if (!trip) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `Trip with ID: ${dto.tripId} was not found`,
                    cause: 'Not found trip id',
                });
            }

            const seats = await transactionalEntityManager
                .getRepository(Seat)
                .createQueryBuilder('seat')
                .setLock('pessimistic_read')
                .leftJoin('seat.bus', 'bus')
                .where('seat.id IN (:...seatIds)', { seatIds: dto.seatIds })
                .andWhere('(seat.isActive OR seat.deactivateDate IS NULL OR seat.deactivateDate > NOW())')
                .andWhere('bus.id = :tripBus', { tripBus: trip.bus.id })
                .getMany();
            if (seats.length !== dto.seatIds.length) {
                const notFoundSeatIds = dto.seatIds.filter(id => !seats.find(seat => seat.id === id));
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `One or more seats were not found, IDs: ${notFoundSeatIds.join(', ')}`,
                    cause: 'Not found seat ids',
                });
            }

            const alreadyBookedSeats = await transactionalEntityManager
                .getRepository(Booking)
                .createQueryBuilder('booking')
                .leftJoin("booking.trip", "trip")
                .leftJoin("booking.seats", "seats")
                .where("trip.id = :tripId", { tripId: trip.id })
                .andWhere("NOW() < booking.expiresAt")
                .andWhere("seats.id IN (:...seatIds)", { seatIds: dto.seatIds })
                .getMany();

            if (alreadyBookedSeats.length) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: `One or more selected seats are already booked for this trip, IDs: ${alreadyBookedSeats.map(s => s.id).join(', ')}`,
                    cause: 'Seats already booked',
                });
            }

            const { isGuestPayment, guestPaymentProvider } = dto.paymentDetails;

            // TODO: use this after integrate payment
            // if ((user && !paymentMethodId) || (!user && !isGuestPayment)) {
            //     const message = user && !paymentMethodId ?
            //         'Payment method ID must be provided for registered users' :
            //         'Guest payment details must be provided for guest users';
            //     throw new TRPCError({
            //         code: 'BAD_REQUEST',
            //         message,
            //         cause: 'Invalid payment details',
            //     });
            // }

            let payment = transactionalEntityManager
                .getRepository(Payment)
                .create({
                    amount: trip.basePrice * seats.length,
                    status: PaymentStatusEnum.PROCESSING,
                });

            payment.isGuestPayment = true;
            payment.guestPaymentProvider = guestPaymentProvider!;
            payment = await transactionalEntityManager.save(payment);

            const expiresAt = new Date(Date.now() + convertToMs('30m'));
            const token = crypto.randomBytes(32).toString('hex');
            const cancelToken = crypto.randomBytes(32).toString('hex');
            let booking = transactionalEntityManager
                .getRepository(Booking)
                .create({
                    trip,
                    seats,
                    user,
                    fullName: dto.fullName,
                    phone: dto.phone,
                    email: dto.email,
                    totalPrice: trip.basePrice * seats.length,
                    payment,
                    token,
                    cancelToken,
                    expiresAt,
                });
            booking = await transactionalEntityManager.save(booking);

            return booking;
        });
    }

    /**
     * Confirm payment and send e-ticket email
     */
    async confirmBooking(dto: BookingConfirmDtoType) {
        const booking = await this.entityManager
            .getRepository(Booking)
            .findOne({
                where: { token: dto.token },
                relations: {
                    payment: true,
                    trip: { route: { origin: true, destination: true } },
                    seats: true,
                },
            });

        if (!booking) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Booking not found"
            });
        }

        if (booking.payment.status === PaymentStatusEnum.COMPLETED) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Booking already paid"
            });
        }

        if (booking.expiresAt && booking.expiresAt < new Date()) {
            await this.entityManager
                .getRepository(Booking)
                .delete({ id: booking.id });
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Booking expired"
            });
        }

        booking.payment.status = PaymentStatusEnum.COMPLETED;
        await this.entityManager.save(booking.payment);
        booking.expiresAt = null;
        const savedBooking = await this.entityManager.save(booking);

        if (!booking.email || (booking.email.trim().length > 0)) {
            return {
                booking: savedBooking,
            };
        }

        // email baby
        try {
            const departureDateTime = new Date(savedBooking.trip.departureTime).toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });

            const totalPrice = new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'VND',
                currencyDisplay: 'code',
            }).format(Math.ceil(Number(savedBooking.totalPrice)));

            const seatCodes = savedBooking.seats.map(seat => seat.code);

            await this.mailerService.sendETicket({
                email: savedBooking.email,
                fullName: savedBooking.fullName,
                bookingCode: savedBooking.lookupCode,
                origin: savedBooking.trip.route.origin.name,
                destination: savedBooking.trip.route.destination.name,
                departureDateTime,
                seatCodes,
                totalPrice,
                token: savedBooking.token,
            });
        } catch (error) {
            this.logger.error(
                `Failed to send e-ticket for booking ${savedBooking.id}:`,
                error instanceof Error ? error.message : 'Unknown error'
            );
        }

        return {
            booking: savedBooking,
        };
    }

    async lookUpOneBooking(dto: BookingLookUpDtoType) {
        const booking = await this.entityManager
            .getRepository(Booking)
            .findOne({
                where: { lookupCode: dto.bookingCode },
                relations: {
                    trip: { bus: { type: true }, route: { origin: true, destination: true } },
                    seats: true,
                    payment: true,
                },
            });
        if (!booking) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: `Booking with code: ${dto.bookingCode} was not found`,
                cause: "Not found booking code",
            });
        }
        if (booking.phone !== dto.phone) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You are not allowed to read this booking info, incorrect phone number",
            });
        }

        return booking;
    }

    async userSearchBookings(dto: BookingUserSearchDtoType, user: User) {
        const qb = this.entityManager
            .getRepository(Booking)
            .createQueryBuilder('booking')
            .leftJoin('booking.user', 'user')
            .leftJoinAndSelect('booking.trip', 'trip')
            .leftJoinAndSelect('trip.bus', 'bus')
            .leftJoinAndSelect('trip.route', 'route')
            .leftJoinAndSelect('route.origin', 'origin')
            .leftJoinAndSelect('route.destination', 'destination')
            .leftJoinAndSelect('bus.type', 'busType')
            .leftJoinAndSelect('booking.seats', 'seats')
            .leftJoinAndSelect('booking.payment', 'payment')
            .where('user.id = :userId', { userId: user.id });

        if (dto.sortDate) {
            qb.orderBy('trip.departureTime', dto.sortDate.toUpperCase() as "ASC" | "DESC");
        }
        if (dto.sortPrice) {
            qb.addOrderBy('booking.totalPrice', dto.sortPrice.toUpperCase() as "ASC" | "DESC");
        }

        if (dto.upcoming) {
            qb.andWhere('trip.departureTime > NOW()');
        }
        else if (dto.completed) {
            qb.andWhere('trip.arrivalTime < NOW()');
        }

        qb.skip((dto.page - 1) * dto.perPage)
            .take(dto.perPage);

        const [bookings, count] = await qb.getManyAndCount();

        const totalPage = Math.ceil(count / dto.perPage);

        return {
            data: bookings,
            page: Math.min(dto.page, totalPage),
            perPage: Math.min(dto.perPage, count),
            total: count,
            totalPage,
        };
    }

    async userCancelBooking(dto: BookingCancelDtoType, user: User | undefined) {
        const booking = await this.entityManager
            .getRepository(Booking)
            .createQueryBuilder('booking')
            .leftJoinAndSelect('booking.user', 'user')
            .leftJoinAndSelect('booking.payment', 'payment')
            .where('booking.cancelToken = :cancelToken', { cancelToken: dto.cancelToken })
            .getOne();

        if (!booking) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: `Booking was not found`,
                cause: "Not found booking",
            });
        }

        if (booking.user?.id !== user?.id) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: `You are not allowed to delete this booking`,
                cause: "Not owner of the booking",
            });
        }

        // this has cascade
        await this.entityManager
            .getRepository(Payment)
            .delete({ id: booking.payment.id });
    }

    async getBookingSeatsByTrip(dto: GetBookingSeatsByTripDtoType) {
        const bookings = await this.entityManager
            .getRepository(Booking)
            .createQueryBuilder('booking')
            .leftJoin('booking.trip', 'trip')
            .leftJoin('booking.seats', 'seats')
            .where('trip.id = :tripId', { tripId: dto.tripId })
            .andWhere('NOW() < booking.expiresAt OR booking.expiresAt IS NULL')
            .select(['booking.id', 'seats.id'])
            .getMany();
        return bookings.map(booking => booking.seats).flat();
    }
}
