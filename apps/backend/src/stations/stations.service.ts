import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StationCreateDtoType, StationDeleteDtoType, StationFindOneDtoType, StationSearchDtoType, StationUpdateOneDtoType } from '@repo/shared';
import { TRPCError } from '@trpc/server';
import { Station } from '../entities/station.entity';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';

@Injectable()
export class StationsService {
    constructor(
        @InjectRepository(Station)
        private readonly stationRepo: Repository<Station>,
    ) { }

    async createOne(dto: StationCreateDtoType) {
        const existingStation = await this.findOneBy({ name: dto.name });
        if (existingStation) {
            throw new TRPCError({
                code: "CONFLICT",
                message: `The station "${existingStation.name}" already exists`,
                cause: "Duplicate station name",
            });
        }

        const newStation = this.stationRepo.create(dto);
        return await this.stationRepo.save(newStation);
    }

    async deleteOne(dto: StationDeleteDtoType) {
        let criteria: FindOptionsWhere<Station>;
        if (dto.id) {
            criteria = { id: dto.id };
        }
        else {
            criteria = { name: dto.name };
        }
        await this.stationRepo.delete(criteria);
    }

    async updateOne(dto: StationUpdateOneDtoType) {
        const duplicateName = await this.findOneBy({ name: dto.name });
        if (duplicateName) {
            throw new TRPCError({
                code: "CONFLICT",
                message: `The station with name "${dto.name}" already exists`,
                cause: "Duplicate station name",
            });
        }
        const station = await this.findOneBy({ id: dto.id });
        if (!station) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "The station is not found",
            });
        }
        station.name = dto.name;
        return await this.stationRepo.save(station);
    }

    async findOne(dto: StationFindOneDtoType) {
        let criteria: FindOptionsWhere<Station>;
        if (dto.id) {
            criteria = { id: dto.id };
        }
        else {
            criteria = { name: dto.name };
        }
        return this.findOneBy(criteria);
    }

    async search(dto: StationSearchDtoType) {
        // If no search query, return all stations with simple sorting
        if (!dto.nameQuery) {
            const [stations, count] = await this.stationRepo.findAndCount({
                order: { name: dto.sortName ?? "asc" },
                skip: (dto.page - 1) * dto.perPage,
                take: dto.perPage,
            });

            const totalPage = Math.ceil(count / dto.perPage);

            return {
                data: stations,
                page: Math.min(dto.page, totalPage),
                perPage: Math.min(dto.perPage, count),
                total: count,
                totalPage,
            };
        }

        const searchTerm = dto.nameQuery.trim();

        // Use PostgreSQL full-text search for better relevance ranking
        // to_tsquery with prefix matching for partial word matches
        const searchQuery = searchTerm
            .split(/\s+/)
            .filter(word => word.length > 0)
            .map(word => `${word}:*`)
            .join(' & ');

        // Combined query: Full-text search + Trigram fuzzy matching
        // This handles both exact/prefix matches AND typo tolerance
        const queryBuilder = this.stationRepo
            .createQueryBuilder('station')
            .where(
                `to_tsvector('english', station.name) @@ to_tsquery('english', :query) OR similarity(station.name, :searchTerm) > 0.1`,
                { query: searchQuery, searchTerm }
            )
            .addSelect(
                `GREATEST(
                    ts_rank(to_tsvector('english', station.name), to_tsquery('english', :query)),
                    similarity(station.name, :searchTerm)
                )`,
                'relevance'
            )
            .orderBy('relevance', 'DESC')
            .addOrderBy('station.name', 'ASC');

        const results = await queryBuilder.getRawAndEntities();
        
        let stations: Station[];
        let count: number;

        if (results.entities.length > 0) {
            // Already sorted by relevance from query
            const offset = (dto.page - 1) * dto.perPage;
            stations = results.entities.slice(offset, offset + dto.perPage);
            count = results.entities.length;
        } else {
            // Fallback to ILIKE pattern matching if no matches at all
            const [fallbackStations, fallbackCount] = await this.stationRepo.findAndCount({
                where: { name: ILike(`%${searchTerm}%`) },
                order: { name: dto.sortName ?? "asc" },
                skip: (dto.page - 1) * dto.perPage,
                take: dto.perPage,
            });
            stations = fallbackStations;
            count = fallbackCount;
        }

        const totalPage = Math.ceil(count / dto.perPage);

        return {
            data: stations,
            page: Math.min(dto.page, totalPage),
            perPage: Math.min(dto.perPage, count),
            total: count,
            totalPage,
        };
    }

    findOneBy(where: FindOptionsWhere<Station> | FindOptionsWhere<Station>[]) {
        return this.stationRepo.findOneBy(where);
    }

    async findAll() {
        return await this.stationRepo.find({
            order: { name: 'ASC' },
        });
    }
}
