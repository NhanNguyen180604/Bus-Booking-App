import z from "zod";
import { PaginationDto, sortOptions } from "./common";

export const BusTypeCreateOneDto = z.object({
    name: z.string().trim().nonempty({ error: "Name must not be empty" }),
    priceMultiplier: z.number().gte(1, { error: "Price multiplier must be >= 1" }),
});
export type BusTypeCreateOneDtoType = z.infer<typeof BusTypeCreateOneDto>;

export const BusTypeUpdateOneDto = z.object({
    id: z.uuid({ error: "ID must be an UUID string" }),
}).extend(BusTypeCreateOneDto.partial().shape)
    .refine(
        (data) => data.name !== undefined || data.priceMultiplier !== undefined,
        {
            error: "At least 1 field data or priceMultiplier must be provided",
        }
    );
export type BusTypeUpdateOneDtoType = z.infer<typeof BusTypeUpdateOneDto>;

export const BusTypeDeleteOneDto = z.object({
    id: z.uuid({ error: "ID must be an UUID string" }),
});
export type BusTypeDeleteOneDtoType = z.infer<typeof BusTypeDeleteOneDto>;

export const BusTypeFindDto = z.object({
    sortName: sortOptions,
    sortPriceMultiplier: sortOptions,
    nameQuery: z.string().trim().nonempty({ error: "Name query must not be emtpy" }).optional(),
    priceMultiplierMin: z.number().gte(1, { error: "Price multiplier must be >= 1" }).optional(),
    priceMultiplierMax: z.number().gte(1, { error: "Price multiplier must be >= 1" }).optional(),
}).extend(PaginationDto.shape)
    .refine(
        (data) => !(data.priceMultiplierMin !== undefined && data.priceMultiplierMax !== undefined) || data.priceMultiplierMin <= data.priceMultiplierMax,
        {
            error: "priceMultiplierMin must be <= priceMultiplierMax",
        }
    )
export type BusTypeFindDtoType = z.infer<typeof BusTypeFindDto>;