import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Bus } from '../entities/bus.entity';
import { EntityManager, FindOneOptions, In, Repository, Not, Or, Equal, } from 'typeorm';
import {
    BusAddSeatsDtoType,
    BusCreateOneDtoType,
    BusCreateOneWithSeatsDtoType,
    BusDeleteOneDtoType,
    BusGetOneByIdDtoType,
    BusGetSeatsByBusIdDtoType,
    BusSearchDtoType,
    BusSeatCreateOneDtoType,
    BusSeatsGetManyByIdsDtoType,
    BusStatusEnum,
    BusUpdateOneDtoType,
    generateSeatCode,
    NO_DRIVER,
    PaymentStatusEnum,
    SeatTypeEnum,
    TripStatusEnum,
    UserRoleEnum
} from '@repo/shared';
import { Seat } from '../entities/seat.entity';
import { UsersService } from '../users/users.service';
import { User } from '../entities/users.entity';
import { BusTypesService } from '../bus-types/bus-types.service';
import { TRPCError } from '@trpc/server';
import { Booking } from 'src/entities/booking.entity';
import { groupBy } from 'lodash';
import { Payment } from 'src/entities/payment.entity';
import { StripeService } from 'src/stripe/stripe.service';
import { MyMailerService } from 'src/my-mailer/my-mailer.service';
import { Trip } from 'src/entities/trip.entity';

@Injectable()
export class BusesService {
    logger = new Logger(BusesService.name);
    constructor(
        @InjectRepository(Bus)
        private readonly busRepo: Repository<Bus>,
        @InjectRepository(Seat)
        private readonly seatRepo: Repository<Seat>,
        private readonly usersService: UsersService,
        private readonly busTypesService: BusTypesService,
        private readonly stripeService: StripeService,
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
        private readonly mailerService: MyMailerService,
    ) { }

    async createOne(dto: BusCreateOneDtoType) {
        let driver: User | null = null;
        if (dto.driverId) {
            driver = await this.usersService.findOneBy({ id: dto.driverId, role: UserRoleEnum.DRIVER });
            if (!driver) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: `Driver with ID: ${dto.driverId} not found`,
                    cause: "Driver ID is not found",
                });
            }
        }

        const busType = await this.busTypesService.findOneHelper({ where: { id: dto.busTypeId } });
        if (!busType) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: `Bus type with ID: ${dto.busTypeId} is not found`,
                cause: "Bus type ID is not found",
            });
        }

        const duplicatePlateNumber = await this.findOneBusHelper({ where: { plateNumber: dto.plateNumber } });
        if (duplicatePlateNumber) {
            throw new TRPCError({
                code: "CONFLICT",
                message: `Bus with plate number: ${dto.plateNumber} already exists`,
                cause: "Duplicate plate number",
            });
        }

        const newBus = this.busRepo.create({
            ...dto,
            type: busType,
        });
        if (driver) {
            newBus.driver = driver;
        }

        return await this.busRepo.save(newBus);
    }

    async createOneWithSeats(dto: BusCreateOneWithSeatsDtoType) {
        const newBus = await this.createOne(dto.bus);

        try {
            // this will throw error if invalid
            this.validateSeatsLayout(dto.seats, dto.bus.rows, dto.bus.cols, dto.bus.floors);

            let newSeats = this.seatRepo.create(dto.seats.map(seat => ({
                bus: newBus,
                code: generateSeatCode(seat.row, seat.col, seat.floor),
                row: seat.row,
                col: seat.col,
                floor: seat.floor,
                seatType: seat.seatType,
            })));
            newSeats = await this.seatRepo.save(newSeats, { transaction: true });

            return {
                bus: newBus,
                seats: newSeats,
            };
        }
        catch (error) {
            await this.busRepo.delete({ id: newBus.id });
            throw error;
        }
    }

    /**
     * Add 1 or multiple seats to the bus by ID
     */
    async addSeats(dto: BusAddSeatsDtoType) {
        const bus = await this.findOneBusHelper({ where: { id: dto.busId } });
        if (!bus) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: `Bus with ID: ${dto.busId} is not found`,
                cause: "Bus ID is not found",
            });
        }

        // this will throw error if invalid
        this.validateSeatsLayout(dto.seats, bus.rows, bus.cols, bus.floors);
        // TODO: get existing seats and validate layout too

        // scrapped
        // // coded this at 0AM
        // // this needs more testing
        // dto.seats.sort((a, b) => a.floor - b.floor);
        // const seatsGroupedByFloor = Object.values(groupBy(dto.seats, seat => seat.floor));
        // for (let i = 0; i < seatsGroupedByFloor.length; i++) {
        //     const seatGroup = seatsGroupedByFloor.at(i)!;
        //     const matrix = Array.from({ length: bus.rows }, () => new Array(bus.cols).fill(-1)) as number[][];
        //     for (let currentSeatIndex = 0; currentSeatIndex < seatGroup.length; currentSeatIndex++) {
        //         const currentSeat = seatGroup.at(currentSeatIndex)!;
        //         const rowStartIndex = currentSeat.row;
        //         const rowEndIndex = currentSeat.row + currentSeat.rowSpan - 1;
        //         const colStartIndex = currentSeat.col;
        //         const colEndIndex = currentSeat.col + currentSeat.colSpan - 1;
        //         for (let k = rowStartIndex; k <= rowEndIndex; k++) {
        //             for (let l = colStartIndex; l <= colEndIndex; l++) {
        //                 if (matrix[k][l] !== -1) {
        //                     throw new TRPCError({
        //                         code: "BAD_REQUEST",
        //                         message: `Invalid seat layout, overlapping seats detected. Overlapping seat indices: ${matrix[k][l]} and ${currentSeatIndex}`,
        //                         cause: "Row index, row span, col index, col span or floor violates the bus layout range constraint",
        //                     });
        //                 }
        //                 matrix[k][l] = currentSeatIndex;
        //             }
        //         }
        //     }
        // }

        const newSeats = this.seatRepo.create(dto.seats.map(seat => ({
            bus,
            code: generateSeatCode(seat.row, seat.col, seat.floor),
            row: seat.row,
            col: seat.col,
            // rowSpan: seat.rowSpan,
            // colSpan: seat.colSpan,
            floor: seat.floor,
            seatType: seat.seatType,
        })));
        return await this.seatRepo.save(newSeats, { transaction: true });
    }

    validateSeatsLayout(seats: BusSeatCreateOneDtoType[], busRows: number, busCols: number, busFloors: number) {
        if (!seats.every(
            (v) => v.row >= 0 && v.row < busRows &&
                v.col >= 0 && v.col < busCols &&
                v.floor >= 0 && v.floor < busFloors
        )) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid seat layout, row or col or floor violates the bus layout range constraint",
                cause: "Row index, row span, col index, col span or floor violates the bus layout range constraint",
            });
        }

        const seatSet = new Set<string>();
        for (let i = 0; i < seats.length; i++) {
            const seat = seats[i];
            const key = `${seat.row}-${seat.col}-${seat.floor}`;
            if (seatSet.has(key)) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Invalid seat layout, overlapping seats detected. Overlapping seat (row-col-floor): ${key}`,
                    cause: "Row index, row span, col index, col span or floor violates the bus layout range constraint",
                });
            }
        }
    }

    async getSeatsByBus(dto: BusGetSeatsByBusIdDtoType) {
        const bus = await this.findOneBusHelper({ where: { id: dto.id } });
        if (!bus) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: `Bus with ID: ${dto.id} is not found`,
                cause: "Not found bus ID",
            });
        }
        return await this.seatRepo.find({
            where: { bus: { id: dto.id } },
            order: {
                floor: "ASC",
                row: "ASC",
                col: "ASC",
            }
        });
    }

    async getManySeatsByIds(dto: BusSeatsGetManyByIdsDtoType) {
        return await this.seatRepo.find({
            where: { id: In(dto.ids) },
        });
    }

    async getOneBusById(dto: BusGetOneByIdDtoType) {
        const bus = await this.findOneBusHelper({
            where: { id: dto.id },
            relations: { driver: true },
        });
        if (!bus) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: `Bus with ID: ${dto.id} is not found`,
                cause: "Not found bus ID",
            });
        }

        if (bus.driver) {
            bus.driver = {
                ...bus.driver,
                password: '',

            };
        }
        return bus;
    }

    // i'm losing brain cells
    async updateOneBus(dto: BusUpdateOneDtoType) {
        return await this.entityManager.transaction(async (transactionalEntityManager) => {
            const { id: busId, bus: updateBusDto, seats: updateSeatsDto } = dto;

            // actually update the bus
            let bus = await transactionalEntityManager.getRepository(Bus)
                .findOne({
                    where: { id: busId },
                    relations: { seats: true, driver: true, type: true },
                    order: { seats: { floor: "ASC", row: "ASC", col: "ASC" } },
                });
            if (!bus)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: `Bus with ID ${busId} not found`,
                });

            if (updateBusDto.driverId === NO_DRIVER) bus.driver = undefined;
            else if (updateBusDto.driverId !== bus.driver?.id) {
                // frontend fetches driver with no bus, no need to check for now
                const newDriver = await transactionalEntityManager.getRepository(User)
                    .findOneBy({ id: updateBusDto.driverId, role: UserRoleEnum.DRIVER });
                if (!newDriver)
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: `Driver with ID ${updateBusDto.driverId} not found`,
                    });
                bus.driver = newDriver;
            }
            let driver = bus.driver;
            bus.plateNumber = updateBusDto.plateNumber;
            bus.status = updateBusDto.status;
            bus = await transactionalEntityManager.save(bus);

            const deactivatedSeatIds = [] as string[];
            bus.seats = bus.seats.map(seat => {
                const updateSeat = updateSeatsDto.find(s => s.id === seat.id);
                if (updateSeat && !updateSeat.isActive) {
                    deactivatedSeatIds.push(seat.id);
                }
                return {
                    ...seat,
                    isActive: updateSeat?.isActive ?? seat.isActive,
                };
            });
            await transactionalEntityManager
                .getRepository(Seat)
                .save(bus.seats);
            // actually update the bus


            // attempt re-assign trip bookings if needed
            const deactivateSeatIdSet = new Set(deactivatedSeatIds);
            const activeSeats = bus.seats.filter(seat => seat.isActive && seat.seatType === SeatTypeEnum.PASSENGER);
            const bookingsWithThisBus = await transactionalEntityManager.getRepository(Booking)
                .find({
                    where: {
                        trip: { status: TripStatusEnum.UPCOMING },
                        payment: { status: Or(Equal(PaymentStatusEnum.COMPLETED), Equal(PaymentStatusEnum.PROCESSING)) }
                    },
                    relations: {
                        trip: {
                            route: {
                                origin: true,
                                destination: true
                            },
                        },
                        seats: true,
                        payment: true,
                    },
                });
            const bookingsGroupedByTrips = groupBy(bookingsWithThisBus, 'trip.id');
            const canceledBookings = [] as Booking[];
            const reservedBus = await this.findReservedBus(bus, transactionalEntityManager);
            const freeReservedSeats = reservedBus ? reservedBus.seats.filter(s => s.isActive && s.seatType === SeatTypeEnum.PASSENGER) : [];

            let useReservedBus = false;
            if (bus.status === BusStatusEnum.ACTIVE) {
                this.logger.log("Easy case:\n");
                const result = await this.handleActiveBusReassignment(
                    bookingsGroupedByTrips,
                    deactivateSeatIdSet,
                    activeSeats,
                    reservedBus,
                    freeReservedSeats,
                    transactionalEntityManager
                );
                useReservedBus = result.useReservedBus;
                canceledBookings.push(...result.canceledBookings);
            } else {
                await this.handleInactiveBusReassignment(
                    bookingsGroupedByTrips,
                    reservedBus,
                    freeReservedSeats,
                    transactionalEntityManager
                );
            }

            // swap to reserved bus
            if (useReservedBus && reservedBus) {
                reservedBus.status = BusStatusEnum.ACTIVE;
                reservedBus.driver = driver;  // there will be case the driver here is undefined, admin deals with that in the frontend
                bus.driver = undefined;
                await transactionalEntityManager.save([reservedBus, bus]);
            }

            for (const booking of canceledBookings) {
                // send apology mail
                await this.mailerService.sendRefundNotification(booking);
            }

            return bus;
        });
    }

    async deleteOne(dto: BusDeleteOneDtoType) {
        const bus = await this.findOneBusHelper({ where: { id: dto.id } });
        if (!bus) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: `Bus with ID: ${dto.id} is not found`,
                cause: "Not found bus ID",
            });
        }
        await this.busRepo.delete({ id: bus.id });
        await this.seatRepo.delete({ bus: bus });
    }

    async searchBus(dto: BusSearchDtoType) {
        const qb = this.busRepo
            .createQueryBuilder("bus")
            .leftJoinAndSelect("bus.driver", "driver")
            .leftJoinAndSelect("bus.type", "type")
            .skip((dto.page - 1) * dto.perPage)
            .take(dto.perPage);

        if (dto.driverNotNull) {
            qb.andWhere("bus.driver IS NOT NULL");
        }

        if (dto.driverId) {
            qb.andWhere("driver.id = :driverId", { driverId: dto.driverId });
        }

        if (dto.typeId) {
            qb.andWhere("type.id = :typeId", { typeId: dto.typeId });
        }

        if (dto.plateNumberQuery) {
            qb.andWhere("bus.plateNumber ILIKE :plateQuery", {
                plateQuery: `%${dto.plateNumberQuery}%`,
            });
        }

        if (dto.driverNameSort) {
            qb.addOrderBy("driver.name", dto.driverNameSort === "asc" ? "ASC" : "DESC");
        }

        if (dto.plateNumberSort) {
            qb.addOrderBy("bus.plateNumber", dto.plateNumberSort === "asc" ? "ASC" : "DESC");
        }

        const [buses, count] = await qb.getManyAndCount();

        const totalPage = Math.ceil(count / dto.perPage);

        return {
            data: buses,
            page: Math.min(dto.page, totalPage),
            perPage: Math.min(dto.perPage, count),
            total: count,
            totalPage,
        };
    }

    findOneBusHelper(options: FindOneOptions<Bus>) {
        return this.busRepo.findOne(options);
    }

    private async findReservedBus(bus: Bus, transactionalEntityManager: EntityManager): Promise<Bus | null> {
        return await transactionalEntityManager.getRepository(Bus)
            .createQueryBuilder('bus')
            .innerJoinAndSelect('bus.seats', 'seat')
            .leftJoin('bus.type', 'busType')
            .where('bus.status = :status', { status: BusStatusEnum.RESERVED })
            .andWhere('busType.id = :typeId', { typeId: bus.type.id })
            .andWhere('seat.isActive = TRUE')
            .andWhere(qb => {
                const subQuery = qb.subQuery()
                    .select('COUNT(s.id)', 'count')
                    .from(Seat, 's')
                    .where('s.busId = bus.id')
                    .andWhere('s.isActive = TRUE')
                    .getQuery();
                return `${subQuery} >= :requiredSeatCount`;
            }, { requiredSeatCount: bus.seats.length })
            .getOne();
    }

    private async handleActiveBusReassignment(
        bookingsGroupedByTrips: Record<string, Booking[]>,
        deactivateSeatIdSet: Set<string>,
        activeSeats: Seat[],
        reservedBus: Bus | null,
        freeReservedSeats: Seat[],
        transactionalEntityManager: EntityManager
    ): Promise<{ useReservedBus: boolean; canceledBookings: Booking[] }> {
        let useReservedBus = false;
        const canceledBookings: Booking[] = [];
        const seatChangedBookings: { booking: Booking; oldSeats: string[]; newSeats: string[] }[] = [];

        for (const [tripId, bookings] of Object.entries(bookingsGroupedByTrips)) {
            this.logger.log(`Trip ID: ${tripId}`);
            if (useReservedBus) {
                this.logger.log("Full re-assign to new bus\n");
                const oldSeatsMap = new Map<string, string[]>();
                for (const booking of bookings) {
                    oldSeatsMap.set(booking.id, booking.seats.map(s => s.code));
                }
                await this.swapToReservedBus(bookings, freeReservedSeats, transactionalEntityManager);
                for (const booking of bookings) {
                    const oldSeats = oldSeatsMap.get(booking.id)!;
                    const newSeats = booking.seats.map(s => s.code);
                    seatChangedBookings.push({ booking, oldSeats, newSeats });
                }
                await transactionalEntityManager.getRepository(Trip)
                    .update({ id: tripId }, { bus: reservedBus! });
                continue;
            }

            const bookingsToUpdate = bookings.filter(booking => booking.seats.some(s => deactivateSeatIdSet.has(s.id)));
            if (bookingsToUpdate.length === 0) continue;

            const occupiedUnaffectedSeats = bookings
                .filter(booking => booking.seats.every(s => !deactivateSeatIdSet.has(s.id)))
                .map(booking => booking.seats).flat();
            const freeSeats = activeSeats.filter(seat => !occupiedUnaffectedSeats.some(occupiedSeat => occupiedSeat.id === seat.id));

            if (freeSeats.length < bookingsToUpdate.length) {
                if (!reservedBus) {
                    let bookingToUpdateIndex = 0;
                    let freeSeatIndex = 0;
                    let flag = false;
                    // re-assign as many as possible
                    for (; bookingToUpdateIndex < bookingsToUpdate.length; bookingToUpdateIndex++) {
                        const booking = bookingsToUpdate[bookingToUpdateIndex];
                        const seatCount = booking.seats.length;
                        for (let i = 0; i < seatCount; i++) {
                            if (freeSeatIndex == freeSeats.length) {
                                flag = true;
                                break;
                            }
                            booking.seats[i] = freeSeats[freeSeatIndex];
                            freeSeatIndex++;
                        }
                        if (flag) break;
                    }
                    // the unlucky get full refund
                    for (; bookingToUpdateIndex < bookingsToUpdate.length; bookingToUpdateIndex++) {
                        const booking = bookingsToUpdate[bookingToUpdateIndex];
                        await this.refundBooking(booking);
                        canceledBookings.push(booking);
                    }
                    await transactionalEntityManager.save(bookingsToUpdate);
                }
                // swap to reserved bus
                else {
                    useReservedBus = true;
                    this.logger.log("Full re-assign to new bus\n");
                    await this.swapToReservedBus(bookings, freeReservedSeats, transactionalEntityManager);
                    await transactionalEntityManager.getRepository(Trip)
                        .update({ id: tripId }, { bus: reservedBus! });
                }
            }
            // happy ending where everyone gets a seat
            else {
                this.logger.log("Can re-assign to new seats in the same bus");
                let freeSeatIndex = 0;
                for (const booking of bookingsToUpdate) {
                    const oldSeats = booking.seats.map(s => s.code);
                    const seatCount = booking.seats.length;
                    for (let i = 0; i < seatCount; i++) {
                        booking.seats[i] = freeSeats[freeSeatIndex];
                        freeSeatIndex++;
                    }
                    const newSeats = booking.seats.map(s => s.code);
                    seatChangedBookings.push({ booking, oldSeats, newSeats });
                }
                await transactionalEntityManager.save(bookingsToUpdate);
            }
        }

        // Send emails for seat changes
        for (const { booking, oldSeats, newSeats } of seatChangedBookings) {
            try {
                await this.mailerService.sendSeatChangeNotification(booking, oldSeats, newSeats);
            } catch (error) {
                this.logger.error(`Failed to send seat change email for booking ${booking.lookupCode}:`, error);
            }
        }

        return { useReservedBus, canceledBookings };
    }

    private async handleInactiveBusReassignment(
        bookingsGroupedByTrips: Record<string, Booking[]>,
        reservedBus: Bus | null,
        freeReservedSeats: Seat[],
        transactionalEntityManager: EntityManager
    ): Promise<void> {
        this.logger.log('Attempt swapping all bookings to reserved bus');
        if (!reservedBus) {
            // cancel and refund all bookings because I'm not good at coding
            this.logger.log("No reserved bus to swap, refunding all bookings");
            const allBookings = Object.values(bookingsGroupedByTrips).flat();
            for (const booking of allBookings) {
                await this.refundBooking(booking);
            }
            await transactionalEntityManager.save(allBookings);
        } else {
            for (const [tripId, bookings] of Object.entries(bookingsGroupedByTrips)) {
                this.logger.log(`Trip ID: ${tripId}`);
                this.logger.log("Full re-assign to new bus\n");
                const oldSeatsMap = new Map<string, string[]>();
                for (const booking of bookings) {
                    oldSeatsMap.set(booking.id, booking.seats.map(s => s.code));
                }
                await this.swapToReservedBus(bookings, freeReservedSeats, transactionalEntityManager);
                for (const booking of bookings) {
                    const oldSeats = oldSeatsMap.get(booking.id)!;
                    const newSeats = booking.seats.map(s => s.code);
                    try {
                        await this.mailerService.sendSeatChangeNotification(booking, oldSeats, newSeats);
                    } catch (error) {
                        this.logger.error(`Failed to send seat change email for booking ${booking.lookupCode}:`, error);
                    }
                }
                await transactionalEntityManager.getRepository(Trip)
                    .update({ id: tripId }, { bus: reservedBus });
            }
        }
    }

    private async refundBooking(booking: Booking): Promise<void> {
        try {
            booking.payment.status = PaymentStatusEnum.REFUNDED;
            booking.payment.cancellationReason = 'No reserved bus to stand in for the trip';
            await this.stripeService.stripe.refunds.create({
                payment_intent: booking.payment.paymentTransactionId,
                reason: 'requested_by_customer',
            });
        } catch (error) {
            this.logger.error(`Could not refund booking`);
            this.logger.error(error.message);
        }
    }

    private async swapToReservedBus(bookings: Booking[], freeReservedSeats: Seat[], transactionalEntityManager: EntityManager): Promise<void> {
        let seatIndex = 0;
        for (const booking of bookings) {
            const seatCount = booking.seats.length;
            for (let i = 0; i < seatCount; i++) {
                booking.seats[i] = freeReservedSeats[seatIndex];
                seatIndex++;
            }
        }
        // pretty bad here, should bulk instead
        await transactionalEntityManager.save(bookings);
    }
}
