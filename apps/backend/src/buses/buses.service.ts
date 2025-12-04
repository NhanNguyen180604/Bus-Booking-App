import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Bus } from '../entities/bus.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { BusAddSeatsDtoType, BusCreateOneDtoType, BusDeleteOneDtoType, BusGetOneByIdDtoType, BusGetSeatsByBusIdDtoType, BusSearchDtoType } from '@repo/shared';
import { Seat } from '../entities/seat.entity';
import { UsersService } from '../users/users.service';
import { User, UserRoleEnum } from '../entities/users.entity';
import { BusTypesService } from '../bus-types/bus-types.service';
import { TRPCError } from '@trpc/server';
import { groupBy } from 'lodash';

@Injectable()
export class BusesService {
    constructor(
        @InjectRepository(Bus)
        private readonly busRepo: Repository<Bus>,
        @InjectRepository(Seat)
        private readonly seatRepo: Repository<Seat>,
        private readonly usersService: UsersService,
        private readonly busTypesService: BusTypesService,
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

        if (!dto.seats.every(
            (v) => v.row >= 0 && v.row < bus.rows && v.row + v.rowSpan - 1 < bus.rows &&
                v.col >= 0 && v.col < bus.cols && v.col + v.colSpan - 1 < bus.cols &&
                v.floor >= 0 && v.floor < bus.floors
        )) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid seat layout, row or col or floor violates the bus layout range constraint",
                cause: "Row index, row span, col index, col span or floor violates the bus layout range constraint",
            });
        }

        // coded this at 0AM
        // this needs more testing
        dto.seats.sort((a, b) => a.floor - b.floor);
        const seatsGroupedByFloor = Object.values(groupBy(dto.seats, seat => seat.floor));
        for (let i = 0; i < seatsGroupedByFloor.length; i++) {
            const seatGroup = seatsGroupedByFloor.at(i)!;
            const matrix = Array.from({ length: bus.rows }, () => new Array(bus.cols).fill(-1)) as number[][];
            for (let currentSeatIndex = 0; currentSeatIndex < seatGroup.length; currentSeatIndex++) {
                const currentSeat = seatGroup.at(currentSeatIndex)!;
                const rowStartIndex = currentSeat.row;
                const rowEndIndex = currentSeat.row + currentSeat.rowSpan - 1;
                const colStartIndex = currentSeat.col;
                const colEndIndex = currentSeat.col + currentSeat.colSpan - 1;
                for (let k = rowStartIndex; k <= rowEndIndex; k++) {
                    for (let l = colStartIndex; l <= colEndIndex; l++) {
                        if (matrix[k][l] !== -1) {
                            throw new TRPCError({
                                code: "BAD_REQUEST",
                                message: `Invalid seat layout, overlapping seats detected. Overlapping seat indices: ${matrix[k][l]} and ${currentSeatIndex}`,
                                cause: "Row index, row span, col index, col span or floor violates the bus layout range constraint",
                            });
                        }
                        matrix[k][l] = currentSeatIndex;
                    }
                }
            }
        }

        const newSeats = this.seatRepo.create(dto.seats.map(seat => ({
            bus,
            code: this.generateSeatCode(seat.row, seat.col, seat.floor),
            row: seat.row,
            rowSpan: seat.rowSpan,
            col: seat.col,
            colSpan: seat.colSpan,
            floor: seat.floor,
        })));
        return await this.seatRepo.save(newSeats, { transaction: true });
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
        return await this.seatRepo.find({ where: { bus: { id: dto.id } } });
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
        return bus;
    }

    async deleteOne(dto: BusDeleteOneDtoType){
        await this.busRepo.delete({id: dto.id});
    }

    async searchBus(dto: BusSearchDtoType) {
        const qb = this.busRepo
            .createQueryBuilder("bus")
            .leftJoinAndSelect("bus.driver", "driver")
            .leftJoinAndSelect("bus.type", "type")
            .skip((dto.page - 1) * dto.perPage)
            .take(dto.perPage);

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


    /**
     * Create a seat code based on position
     */
    generateSeatCode(rowIndex: number, colIndex: number, floorIndex: number): string {
        return `${String(rowIndex + 1).padStart(2, '0')}-${(colIndex + 1).toString(16).padStart(2, '0')}-${String(floorIndex + 1).padStart(2, '0')}`;
    }

    findOneBusHelper(options: FindOneOptions<Bus>) {
        return this.busRepo.findOne(options);
    }
}
