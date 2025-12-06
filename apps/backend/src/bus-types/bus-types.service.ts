import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BusType } from '../entities/bus-type.entity';
import { FindOneOptions, FindOptionsOrder, FindOptionsWhere, ILike, Not, Repository } from 'typeorm';
import { BusTypeCreateOneDtoType, BusTypeDeleteOneDtoType, BusTypeFindDtoType, BusTypeGetOneByIdDtoType, BusTypeUpdateOneDtoType } from '@repo/shared';
import { TRPCError } from '@trpc/server';

@Injectable()
export class BusTypesService {
    constructor(
        @InjectRepository(BusType)
        private readonly busTypeRepo: Repository<BusType>,
    ) { }

    async createOne(dto: BusTypeCreateOneDtoType) {
        const existingType = await this.busTypeRepo.findOneBy({ name: dto.name });
        if (existingType) {
            throw new TRPCError({
                code: "CONFLICT",
                message: `Bus type with name: ${dto.name} already exists`,
                cause: "Duplicate bus type name",
            });
        }

        const newBusType = this.busTypeRepo.create(dto);
        return await this.busTypeRepo.save(newBusType);
    }

    async updateOne(dto: BusTypeUpdateOneDtoType) {
        const busType = await this.busTypeRepo.findOneBy({ id: dto.id });
        if (!busType) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: `Bus type with ID: ${dto.id} is not found`,
                cause: "Not found bus type ID",
            });
        }

        const duplicateName = await this.busTypeRepo.findOneBy({ name: dto.name, id: Not(busType.id) });
        if (duplicateName) {
            throw new TRPCError({
                code: "CONFLICT",
                message: `Bus type with name: ${dto.name} already exists`,
                cause: "Duplicate bus type name",
            });
        }

        busType.name = dto.name;
        return await this.busTypeRepo.save(busType);
    }

    async deleteOne(dto: BusTypeDeleteOneDtoType) {
        await this.busTypeRepo.delete({ id: dto.id });
    }

    findOneHelper(where: FindOneOptions<BusType>) {
        return this.busTypeRepo.findOne(where);
    }

    async getOneById(dto: BusTypeGetOneByIdDtoType) {
        const busType = await this.findOneHelper({ where: { id: dto.id } });
        if (!busType) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: `Bus Type with ID: ${dto.id} not found`,
                cause: "Not found bus type ID",
            });
        }
        return busType;
    }

    async search(dto: BusTypeFindDtoType) {
        let where: FindOptionsWhere<BusType> = {};
        let order: FindOptionsOrder<BusType> = {};

        if (dto.nameQuery) {
            where = { name: ILike(`%${dto.nameQuery}%`) };
        }

        if (dto.sortName) {
            order = { name: dto.sortName };
        }

        const [busTypes, count] = await this.busTypeRepo.findAndCount({
            where,
            order,
            skip: (dto.page - 1) * dto.perPage,
            take: dto.perPage,
        });

        const totalPage = Math.ceil(count / dto.perPage);

        return {
            data: busTypes,
            page: Math.min(dto.page, totalPage),
            perPage: Math.min(dto.perPage, count),
            total: count,
            totalPage,
        }
    }
}
