import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TripAdminSearchDtoType, TripCreateOneDtoType, TripDeleteOneDtoType, TripFindManyDtoType, TripUpdateOneDtoType } from '@repo/shared';
import { TRPCError } from '@trpc/server';
import { Trip } from '../entities/trip.entity';
import { Between, FindManyOptions, FindOneOptions, FindOptionsOrder, FindOptionsWhere, ILike, In, LessThan, MoreThan, Not, Repository } from 'typeorm';
import { Route } from 'src/entities/route.entity';
import { RoutesService } from 'src/routes/routes.service';
import { BusesService } from 'src/buses/buses.service';

@Injectable()
export class TripsService {
    constructor(
        @InjectRepository(Trip)
        private readonly tripRepo: Repository<Trip>,
        private readonly routesService: RoutesService,
        private readonly busesService: BusesService,
    ) { }

    async createOne(dto: TripCreateOneDtoType) {
        const route = await this.routesService.findOneHelper({ where: { id: dto.routeId }, relations: { origin: true, destination: true } });
        const bus = await this.busesService.findOneBusHelper({ where: { id: dto.busId } });
        if (!route || !bus) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: `${!route ? 'Route' : 'Bus'} with ID: ${!route ? dto.routeId : dto.busId} does not exist`,
            });
        }

        const existingTrip = await this.findOneHelper({
            where: {
                route: route,
                bus: bus,
                departureTime: dto.departureTime,
                arrivalTime: dto.arrivalTime,
            },
            relations: { route: true, bus: true },
        });
        if (existingTrip) {
            throw new TRPCError({
                code: "CONFLICT",
                message: "Trip already exists",
            });
        }

        // find trips with this bus in overlapping time
        const overlappingTimeTripCount = await this.tripRepo.count({
            where: {
                bus,
                departureTime: LessThan(dto.arrivalTime),
                arrivalTime: MoreThan(dto.departureTime),
            }
        });
        if (overlappingTimeTripCount) {
            throw new TRPCError({
                code: "CONFLICT",
                message: "Overlapping bus schedule",
            });
        }

        const newTrip = this.tripRepo.create({
            ...dto,
            route: route,
            bus: bus,
            departureTime: dto.departureTime,
            arrivalTime: dto.arrivalTime,
        });
        return await this.tripRepo.save(newTrip);
    }

    async updateOne(dto: TripUpdateOneDtoType) {
        const trip = await this.findOneHelper({
            where: { id: dto.id },
            relations: { route: { origin: true, destination: true }, bus: { type: true, driver: true } },
        });
        if (!trip) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: `Trip with ID: ${dto.id} is not found`,
                cause: "Not found trip ID",
            });
        }

        if (dto.arrivalTime) {
            if (dto.arrivalTime <= trip.departureTime) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Arrival time must be after departure time",
                });
            }
            trip.arrivalTime = dto.arrivalTime;
        }
        if (dto.departureTime) {
            if (dto.departureTime >= trip.arrivalTime) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Departure time must be before arrival time",
                });
            }
            trip.departureTime = dto.departureTime;
        }
        if (dto.routeId && dto.routeId !== trip.route.id) {
            const route = await this.routesService.findOneHelper({ where: { id: dto.routeId }, relations: { origin: true, destination: true } });
            if (!route) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: `Route with ID: ${dto.routeId} does not exist`,
                });
            }
            trip.route = route;
        }
        if (dto.busId && dto.busId !== trip.bus.id) {
            const bus = await this.busesService.findOneBusHelper({ where: { id: dto.busId } });
            if (!bus) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: `Bus with ID: ${dto.busId} does not exist`,
                });
            }
            trip.bus = bus;
        }
        if (dto.basePrice) {
            trip.basePrice = dto.basePrice;
        }

        // find trips with this bus in overlapping time
        const overlappingTimeTripCount = await this.tripRepo.count({
            where: {
                id: Not(trip.id),
                bus: trip.bus,
                departureTime: LessThan(trip.arrivalTime),
                arrivalTime: MoreThan(trip.departureTime),
            }
        });
        if (overlappingTimeTripCount) {
            throw new TRPCError({
                code: "CONFLICT",
                message: "Overlapping bus schedule",
            });
        }

        return await this.tripRepo.save(trip);
    }

    async deleteOne(dto: TripDeleteOneDtoType) {
        await this.tripRepo.delete({ id: dto.id });
    }

    async findMany(dto: TripFindManyDtoType) {
        let where: FindOptionsWhere<Trip> = {};
        let order: FindOptionsOrder<Trip> = {};

        if (dto.origin && dto.destination) {
            where = {
                route: {
                    origin: { id: dto.origin },
                    destination: { id: dto.destination }
                }
            };
        }
        if (dto.departureTime) {
            where = {
                ...where,
                departureTime: Between(
                    new Date(dto.departureTime.setHours(0, 0, 0, 0)),
                    new Date(dto.departureTime.setHours(23, 59, 59, 999))
                ),
            }
        }
        if (dto.minPrice !== undefined && dto.maxPrice !== undefined) {
            where = {
                ...where,
                basePrice: Between(dto.minPrice, dto.maxPrice),
            }
        }
        if (dto.busType && dto.busType.length > 0) {
            where = {
                ...where,
                bus: { type: { id: In(dto.busType) } },
            }
        }
        if (dto.sortPrice) {
            order = { basePrice: dto.sortPrice };
        }
        if (dto.sortDepartureTime) {
            order = { ...order, departureTime: dto.sortDepartureTime };
        }

        const [trips, count] = await this.tripRepo.findAndCount({
            where,
            order,
            relations: { route: { origin: true, destination: true }, bus: { type: true } },
            skip: (dto.page - 1) * dto.perPage,
            take: dto.perPage,
        });

        const totalPage = Math.ceil(count / dto.perPage);

        return {
            trips,
            page: Math.min(dto.page, totalPage),
            perPage: Math.min(dto.perPage, count),
            total: count,
            totalPage,
        }
    }

    async adminSearch(dto: TripAdminSearchDtoType) {
        const {
            page,
            perPage,
            originId,
            destinationId,
            busTypeIds,
            minPrice,
            maxPrice,
            depatureTimeRange,
            sortPrice,
            sortDepartureTime,
        } = dto;

        const qb = this.tripRepo
            .createQueryBuilder("trip")
            .leftJoin("trip.route", "route")
            .leftJoin("route.origin", "originStation")
            .leftJoin("route.destination", "destinationStation")
            .leftJoin("trip.bus", "bus")
            .leftJoin("bus.driver", "driver")
            .leftJoin("bus.type", "busType")
            .select([
                "trip",
                "route",
                "originStation",
                "destinationStation",
                "bus",
                "driver",
                "busType",
            ])
            .skip((page - 1) * perPage)
            .take(perPage);

        // filters
        if (originId) {
            qb.andWhere("originStation.id = :origin", {
                origin: originId,
            });
        }
        if (destinationId) {
            qb.andWhere("destinationStation.id = :destination", {
                destination: destinationId,
            });
        }

        if (busTypeIds?.length) {
            qb.andWhere("busType.id IN (:...busTypeIds)", { busTypeIds });
        }

        if (minPrice !== undefined) {
            qb.andWhere("trip.basePrice >= :minPrice", { minPrice });
        }
        if (maxPrice !== undefined) {
            qb.andWhere("trip.basePrice <= :maxPrice", { maxPrice });
        }

        // filter departure time range
        if (depatureTimeRange?.length) {
            const minuteExpr = `
                EXTRACT(HOUR FROM (trip.departureTime AT TIME ZONE 'Asia/Ho_Chi_Minh')) * 60 +
                EXTRACT(MINUTE FROM (trip.departureTime AT TIME ZONE 'Asia/Ho_Chi_Minh'))
            `;

            const ranges: Record<string, [number, number]> = {
                early: [6 * 60, 11 * 60],
                midday: [11 * 60, 17 * 60],
                late: [17 * 60, 24 * 60],
                midnight: [0, 6 * 60],
            };

            const orConditions: string[] = [];
            const params: any = {};

            depatureTimeRange.forEach((label, idx) => {
                const [min, max] = ranges[label];
                orConditions.push(`(${minuteExpr} BETWEEN :tMin${idx} AND :tMax${idx})`);
                params[`tMin${idx}`] = min;
                params[`tMax${idx}`] = max;
            });

            qb.andWhere(orConditions.join(" OR "), params);
        }

        // sort
        if (sortPrice) {
            qb.addOrderBy("trip.basePrice", sortPrice.toUpperCase() as "ASC" | "DESC");
        }

        if (sortDepartureTime) {
            qb.addOrderBy("trip.departureTime", sortDepartureTime.toUpperCase() as "ASC" | "DESC");
        }

        qb.addOrderBy("trip.departureTime", "DESC");


        const [trips, count] = await qb.getManyAndCount();

        const totalPage = Math.ceil(count / dto.perPage);

        return {
            data: trips,
            page: Math.min(dto.page, totalPage),
            perPage: Math.min(dto.perPage, count),
            total: count,
            totalPage,
        };
    }

    findOneHelper(options: FindOneOptions<Trip>) {
        return this.tripRepo.findOne(options);
    }
}
