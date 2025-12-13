import z from 'zod';
import { PaginationDto, sortOptions } from './common';

export const StationCreateDto = z.object({
    name: z.string().trim().nonempty({ error: "Name must not be empty" }),
})
export type StationCreateDtoType = z.infer<typeof StationCreateDto>;

export const StationDeleteDto = z.object({
    id: z.uuid({ error: "ID must be an UUID" }).optional(),
    name: z.string().trim().nonempty({ error: "Name must not be empty" }).optional()
}).refine(
    (data) => (data.id ? !data.name : data.name !== undefined),
    {
        error: "Exactly one of 'id' or 'name' must be provided",
    }
);
export type StationDeleteDtoType = z.infer<typeof StationDeleteDto>;

export const StationFindOneDto = z.object({
    id: z.uuid({ error: "ID must be an UUID" }).optional(),
    name: z.string().trim().nonempty({ error: "Name must not be empty" }).optional()
}).refine(
    (data) => (data.id ? !data.name : data.name !== undefined),
    {
        error: "Exactly one of 'id' or 'name' must be provided",
    }
);
export type StationFindOneDtoType = z.infer<typeof StationFindOneDto>;

export const StationUpdateOneDto = z.object({
    id: z.uuid({ error: "ID must be an UUID" }),
    name: z.string().trim().nonempty({ error: "Name must not be empty" }),
});
export type StationUpdateOneDtoType = z.infer<typeof StationUpdateOneDto>;

export const StationSearchDto = z.object({
    nameQuery: z.string().trim().optional(),
    sortName: sortOptions,
}).extend(PaginationDto.shape);
export type StationSearchDtoType = z.infer<typeof StationSearchDto>;