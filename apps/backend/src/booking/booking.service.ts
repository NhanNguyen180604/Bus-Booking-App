import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { BookingConfirmDtoType, BookingCreateOneDtoType, BookingLookUpDtoType, BookingUserSearchDtoType, GetBookingSeatsByTripDtoType, PaymentStatusEnum } from '@repo/shared';
import { TRPCError } from '@trpc/server';
import { Booking } from 'src/entities/booking.entity';
import { Payment } from 'src/entities/payment.entity';
import { Seat } from 'src/entities/seat.entity';
import { Trip } from 'src/entities/trip.entity';
import { User } from 'src/entities/users.entity';
import { convertToMs } from 'src/utils/convert-to-ms';
import { EntityManager } from 'typeorm';
import crypto from 'crypto';
import { PaymentMethod } from 'src/entities/payment-method.entity';

@Injectable()
export class BookingService {
    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
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

            const { methodId: paymentMethodId, isGuestPayment, guestPaymentProvider } = dto.paymentDetails;

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

            if (paymentMethodId) {
                const userPaymentMethod = await transactionalEntityManager
                    .getRepository(PaymentMethod)
                    .findOne({ where: { id: paymentMethodId } });
                if (!userPaymentMethod) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: `Payment method with ID: ${paymentMethodId} was not found`,
                        cause: 'Not found payment method id',
                    });
                }
                payment.method = userPaymentMethod;
            }
            else {
                payment.isGuestPayment = true;
                payment.guestPaymentProvider = guestPaymentProvider!;
            }

            payment = await transactionalEntityManager.save(payment);

            const expiresAt = new Date(Date.now() + convertToMs('30m'));
            const token = crypto.randomBytes(32).toString('hex');
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
                    expiresAt,
                });
            booking = await transactionalEntityManager.save(booking);
            if (paymentMethodId) {
                const currentPaymentMethod = booking.payment.method;
                booking.payment.method = {
                    ...currentPaymentMethod,
                    token: '',  // nuh uh
                }
            }

            return booking;
        });
    }

    /**
     * Confirm payment
     */
    async confirmBooking(dto: BookingConfirmDtoType) {
        const booking = await this.entityManager
            .getRepository(Booking)
            .findOne({
                where: { token: dto.token },
                relations: { payment: true },
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
        return {
            booking: await this.entityManager.save(booking),
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
                    payment: { method: true },
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

        if (booking.payment.method) {
            const currentPaymentMethod = booking.payment.method;
            booking.payment.method = {
                ...currentPaymentMethod,
                token: '',  // nuh uh
            }
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
