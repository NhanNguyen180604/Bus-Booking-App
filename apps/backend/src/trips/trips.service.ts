import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TripCreateOneDtoType, TripDeleteOneDtoType, TripFindManyDtoType, TripUpdateOneDtoType } from '@repo/shared';
import { TRPCError } from '@trpc/server';
import { Trip } from '../entities/trip.entity';
import { Between, FindManyOptions, FindOneOptions, FindOptionsOrder, FindOptionsWhere, ILike, In, Repository } from 'typeorm';
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
            relations: { route: true, bus: true },
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
        if (dto.minPrice && dto.maxPrice) {
            where = {
                ...where,
                basePrice: Between(dto.minPrice, dto.maxPrice),
            }
        }
        if (dto.bus && dto.bus.length > 0) {
            where = {
                ...where,
                bus: { id: In(dto.bus) },
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

        return {
            trips,
            page: dto.page,
            perPage: Math.min(dto.perPage, count),
            total: count,
            totalPage: Math.ceil(count / dto.perPage),
        }
    }
    findOneHelper(options: FindOneOptions<Trip>) {
        return this.tripRepo.findOne(options);
    }
}
