import z from "zod";
import { PaginationDto, sortOptions } from "./common";

export const BusTypeCreateOneDto = z.object({
    name: z.string().trim().nonempty({ error: "Name must not be empty" }),
});
export type BusTypeCreateOneDtoType = z.infer<typeof BusTypeCreateOneDto>;

export const BusTypeUpdateOneDto = z.object({
    id: z.uuid({ error: "ID must be an UUID string" }),
}).extend(BusTypeCreateOneDto.shape)
export type BusTypeUpdateOneDtoType = z.infer<typeof BusTypeUpdateOneDto>;

export const BusTypeDeleteOneDto = z.object({
    id: z.uuid({ error: "ID must be an UUID string" }),
});
export type BusTypeDeleteOneDtoType = z.infer<typeof BusTypeDeleteOneDto>;

export const BusTypeGetOneByIdDto = z.object({
    id: z.uuid({ error: "ID must be an UUID string" }),
});
export type BusTypeGetOneByIdDtoType = z.infer<typeof BusTypeGetOneByIdDto>;

export const BusTypeFindDto = z.object({
    sortName: sortOptions,
    nameQuery: z.string().trim().nonempty({ error: "Name query must not be emtpy" }).optional(),
}).extend(PaginationDto.shape)
export type BusTypeFindDtoType = z.infer<typeof BusTypeFindDto>;