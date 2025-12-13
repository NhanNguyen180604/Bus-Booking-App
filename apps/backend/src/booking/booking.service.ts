import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { BookingCancelDtoType, BookingCreateOneDtoType, BookingLookUpDtoType, BookingUpdateDtoType, BookingUserSearchDtoType, GetBookingSeatsByTripDtoType, PaymentProviderEnum, PaymentStatusEnum } from '@repo/shared';
import { TRPCError } from '@trpc/server';
import { Booking } from 'src/entities/booking.entity';
import { Payment } from 'src/entities/payment.entity';
import { Seat } from 'src/entities/seat.entity';
import { Trip } from 'src/entities/trip.entity';
import { User } from 'src/entities/users.entity';
import { convertToMs } from 'src/utils/convert-to-ms';
import { EntityManager } from 'typeorm';
import crypto from 'crypto';
import { StripeService } from 'src/stripe/stripe.service';

@Injectable()
export class BookingService {
    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
        private readonly stripeService: StripeService,
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

            let payment = transactionalEntityManager
                .getRepository(Payment)
                .create({
                    amount: trip.basePrice * seats.length,
                    status: PaymentStatusEnum.PROCESSING,
                    user,
                });

            payment.paymentProvider = PaymentProviderEnum.STRIPE;
            payment = await transactionalEntityManager.save(payment);

            const expiresAt = new Date(Date.now() + convertToMs('30m'));
            const token = crypto.randomBytes(32).toString('hex');
            const totalPrice = trip.basePrice * seats.length;
            const cancelToken = crypto.randomBytes(32).toString('hex');
            let booking = transactionalEntityManager
                .getRepository(Booking)
                .create({
                    trip,
                    seats,
                    fullName: dto.fullName,
                    phone: dto.phone,
                    email: dto.email,
                    totalPrice,
                    payment,
                    token,
                    cancelToken,
                    expiresAt,
                });
            booking = await transactionalEntityManager.save(booking);

            // only stripe for now
            const paymentIntent = await this.stripeService.stripe.paymentIntents.create({
                amount: totalPrice,
                currency: 'VND',
                payment_method_types: ['card'],
                metadata: {
                    bookingId: booking.id,
                    userId: user?.id ?? 'guest',
                },
            });
            payment.paymentTransactionId = paymentIntent.id;

            payment = await transactionalEntityManager.save(payment);
            booking.payment = payment;
            return {
                booking,
                client_secret: paymentIntent.client_secret,
            };
        });
    }

    /**
     * Mark a booking and its payment as completed, called by the webhook
     * @param paymentTransactionId
     */
    async confirmBooking(paymentTransactionId: string) {
        const payment = await this.entityManager
            .getRepository(Payment)
            .findOne({
                where: { paymentTransactionId },
            });

        if (!payment) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Booking not found"
            });
        }

        const booking = await this.entityManager
            .getRepository(Booking)
            .findOne({
                where: {
                    payment: { id: payment.id },
                },
                relations: {
                    payment: true,
                    trip: { route: { origin: true, destination: true } },
                    seats: true,
                },
            })

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

        payment.status = PaymentStatusEnum.COMPLETED;
        await this.entityManager.save(payment);
        booking.payment = payment;
        booking.expiresAt = null;
        return await this.entityManager.save(booking);
    }

    async findOneById(id: string) {
        const booking = await this.entityManager
            .getRepository(Booking)
            .findOne({
                where: { id },
                relations: {
                    trip: { bus: { type: true }, route: { origin: true, destination: true } },
                    seats: true,
                    payment: true,
                },
            });
        if (!booking) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: `Booking with ID: ${id} was not found`,
                cause: "Not found booking id",
            });
        }

        return booking;
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
            .leftJoinAndSelect('booking.trip', 'trip')
            .leftJoinAndSelect('trip.bus', 'bus')
            .leftJoinAndSelect('trip.route', 'route')
            .leftJoinAndSelect('route.origin', 'origin')
            .leftJoinAndSelect('route.destination', 'destination')
            .leftJoinAndSelect('bus.type', 'busType')
            .leftJoinAndSelect('booking.seats', 'seats')
            .leftJoinAndSelect('booking.payment', 'payment')
            .leftJoin('payment.user', 'user')
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
            .leftJoinAndSelect('booking.payment', 'payment')
            .leftJoinAndSelect('payment.user', 'user')
            .where('booking.cancelToken = :cancelToken', { cancelToken: dto.cancelToken })
            .getOne();

        if (!booking) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: `Booking was not found`,
                cause: "Not found booking",
            });
        }

        if (booking.payment.user?.id !== user?.id) {
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

    async updateBooking(dto: BookingUpdateDtoType, user: User | undefined) {
        return this.entityManager.transaction(async (transactionalEntityManager) => {
            const booking = await transactionalEntityManager
                .getRepository(Booking)
                .createQueryBuilder('booking')
                .leftJoinAndSelect('booking.trip', 'trip')
                .leftJoinAndSelect('trip.bus', 'bus')
                .leftJoinAndSelect('booking.payment', 'payment')
                .leftJoinAndSelect('payment.user', 'user')
                .leftJoinAndSelect('booking.seats', 'seats')
                .getOne();

            if (!booking) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: `Booking was not found`,
                    cause: "Not found booking",
                });
            }

            if (booking.payment.user?.id !== user?.id) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: `You are not allowed to edit this booking`,
                    cause: "Not owner of the booking",
                });
            }

            // Check if booking has expired or trip has departed
            if (booking.expiresAt && new Date() > booking.expiresAt) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Cannot edit expired booking`,
                    cause: "Booking expired",
                });
            }

            if (new Date() > booking.trip.departureTime) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Cannot edit booking for completed trip`,
                    cause: "Trip already completed",
                });
            }

            // Update seats if provided
            // if (dto.seatIds && dto.seatIds.length > 0) {
            //     const newSeats = await transactionalEntityManager
            //         .getRepository(Seat)
            //         .createQueryBuilder('seat')
            //         .setLock('pessimistic_read')
            //         .leftJoin('seat.bus', 'bus')
            //         .where('seat.id IN (:...seatIds)', { seatIds: dto.seatIds })
            //         .andWhere('(seat.isActive OR seat.deactivateDate IS NULL OR seat.deactivateDate > NOW())')
            //         .andWhere('bus.id = :tripBus', { tripBus: booking.trip.bus.id })
            //         .getMany();

            //     if (newSeats.length !== dto.seatIds.length) {
            //         const notFoundSeatIds = dto.seatIds.filter(id => !newSeats.find(seat => seat.id === id));
            //         throw new TRPCError({
            //             code: 'NOT_FOUND',
            //             message: `One or more seats were not found, IDs: ${notFoundSeatIds.join(', ')}`,
            //             cause: 'Not found seat ids',
            //         });
            //     }

            //     // Check if any of the new seats are already booked (excluding current booking)
            //     const alreadyBookedSeats = await transactionalEntityManager
            //         .getRepository(Booking)
            //         .createQueryBuilder('booking')
            //         .leftJoin("booking.trip", "trip")
            //         .leftJoin("booking.seats", "seats")
            //         .where("trip.id = :tripId", { tripId: booking.trip.id })
            //         .andWhere("booking.id != :bookingId", { bookingId: booking.id })
            //         .andWhere("NOW() < booking.expiresAt OR booking.expiresAt IS NULL")
            //         .andWhere("seats.id IN (:...seatIds)", { seatIds: dto.seatIds })
            //         .getMany();

            //     if (alreadyBookedSeats.length) {
            //         throw new TRPCError({
            //             code: 'CONFLICT',
            //             message: `One or more selected seats are already booked for this trip`,
            //             cause: 'Seats already booked',
            //         });
            //     }
            //     booking.seats = newSeats;
            // }

            // Update passenger details if provided
            if (dto.fullName !== undefined) booking.fullName = dto.fullName;
            if (dto.phone !== undefined) booking.phone = dto.phone;
            if (dto.email !== undefined) booking.email = dto.email;

            await transactionalEntityManager.save(booking);

            // Return updated booking with relations
            return await transactionalEntityManager
                .getRepository(Booking)
                .findOne({
                    where: { id: booking.id },
                    relations: {
                        trip: { route: { origin: true, destination: true }, bus: { type: true } },
                        seats: true,
                        payment: true,
                    },
                });
        });
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
