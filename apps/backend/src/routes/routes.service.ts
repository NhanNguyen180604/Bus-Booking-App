import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RouteCreateOneDtoType, RouteDeleteOneDtoType, RouteFindOneByIdDtoType, RouteSearchDtoType, RouteUpdateOneDtoType } from '@repo/shared';
import { TRPCError } from '@trpc/server';
import { Route } from '../entities/route.entity';
import { Station } from '../entities/station.entity';
import { StationsService } from '../stations/stations.service';
import { FindOneOptions, FindOptionsOrder, FindOptionsWhere, ILike, Repository } from 'typeorm';

@Injectable()
export class RoutesService {
    constructor(
        @InjectRepository(Route)
        private readonly routeRepo: Repository<Route>,
        private readonly stationsService: StationsService,
    ) { }

    async createOne(dto: RouteCreateOneDtoType) {
        const originStation = await this.stationsService.findOneBy({ id: dto.originId });
        const destinationStation = await this.stationsService.findOneBy({ id: dto.destinationId });
        if (!originStation || !destinationStation) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: `${!originStation ? 'Origin Station' : 'Destination Station'} with ID: ${!originStation ? dto.originId : dto.destinationId} does not exist`,
            });
        }

        const existingRoute = await this.findOneHelper({
            where: {
                origin: originStation,
                destination: destinationStation,
            }
        });
        if (existingRoute) {
            throw new TRPCError({
                code: "CONFLICT",
                message: "Route already exists",
            });
        }

        const newRoute = this.routeRepo.create({
            ...dto,
            origin: originStation,
            destination: destinationStation,
        });
        return await this.routeRepo.save(newRoute);
    }

    async updateOne(dto: RouteUpdateOneDtoType) {
        const route = await this.findOneHelper({
            where: { id: dto.id },
            relations: { origin: true, destination: true },
        });

        if (!route) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: `Route with ID: ${dto.id} is not found`,
                cause: "Not found route ID",
            });
        }

        const originalRoute = { ...route };

        if ((dto.originId && dto.originId === route.destination.id) || (dto.destinationId && dto.destinationId === route.origin.id)) {
            throw new TRPCError({
                code: "CONFLICT",
                message: "Origin and Destination station must not be the same",
                cause: "Origin/Destination ID in the request body is the same as Destination/Origin ID in the route",
            });
        }

        let originStation: Station | null = null;
        let destinationStation: Station | null = null;
        if (dto.originId && dto.originId !== route.origin.id) {
            originStation = await this.stationsService.findOneBy({ id: dto.originId });
            if (!originStation) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: `Origin station with ID: ${dto.originId} is not found`,
                    cause: "Not found origin station ID",
                })
            }
            route.origin = originStation;
        }
        if (dto.destinationId && dto.destinationId !== route.destination.id) {
            destinationStation = await this.stationsService.findOneBy({ id: dto.destinationId });
            if (!destinationStation) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: `Destination station with ID: ${dto.destinationId} is not found`,
                    cause: "Not found destination station ID",
                });
            }
            route.destination = destinationStation;
        }

        const duplicateRoute = await this.findOneHelper({
            where: {
                origin: route.origin,
                destination: route.destination,
            },
            relations: { origin: true, destination: true },
        });

        if (duplicateRoute && (originalRoute.origin.id !== duplicateRoute.origin.id || originalRoute.destination.id !== duplicateRoute.destination.id)) {
            throw new TRPCError({
                code: "CONFLICT",
                message: `Duplicate route the same origin and destination found`,
                cause: "Duplicate route origin and destination",
            });
        }

        if (dto.distanceKm) {
            route.distanceKm = dto.distanceKm;
        }
        if (dto.estimatedMinutes) {
            route.estimatedMinutes = dto.estimatedMinutes;
        }
        return await this.routeRepo.save(route);
    }

    async search(dto: RouteSearchDtoType) {
        const qb = this.routeRepo
            .createQueryBuilder("route")
            .leftJoinAndSelect("route.origin", "origin")
            .leftJoinAndSelect("route.destination", "destination")
            .skip((dto.page - 1) * dto.perPage)
            .take(dto.perPage);

        if (dto.originNameQuery) {
            qb.andWhere("origin.name ILIKE :origin", {
                origin: `%${dto.originNameQuery}%`,
            });
        }

        if (dto.destinationNameQuery) {
            qb.andWhere("destination.name ILIKE :destination", {
                destination: `%${dto.destinationNameQuery}%`,
            });
        }

        if (dto.sortOriginName) {
            qb.addOrderBy("origin.name", dto.sortOriginName === "asc" ? "ASC" : "DESC");
        }

        if (dto.sortDestinationName) {
            qb.addOrderBy("destination.name", dto.sortDestinationName === "asc" ? "ASC" : "DESC");
        }

        const [routes, count] = await qb.getManyAndCount();

        const totalPage = Math.ceil(count / dto.perPage);

        return {
            data: routes,
            page: Math.min(dto.page, totalPage),
            perPage: Math.min(dto.perPage, count),
            total: count,
            totalPage,
        };
    }

    async deleteOne(dto: RouteDeleteOneDtoType) {
        await this.routeRepo.delete({ id: dto.id });
    }

    findOneByid(dto: RouteFindOneByIdDtoType) {
        return this.findOneHelper({
            where: { id: dto.id },
            relations: { origin: true, destination: true },
        });
    }

    findOneHelper(options: FindOneOptions<Route>) {
        return this.routeRepo.findOne(options);
    }
}
