import z from "zod";
import { PaginationDto, sortOptions } from "./common";

export const RouteCreateOneDto = z.object({
    originId: z.uuid({ error: "Origin must be an UUID string" }),
    destinationId: z.uuid({ error: "Destination must be an UUID string" }),
    distanceKm: z.number().gt(0, { error: "Distance must be greater than 0" }),
    estimatedMinutes: z.number().gt(0, { error: "Estimated Minutes must be greater than 0" }),
})
    .refine(
        (data) => data.originId !== data.destinationId,
        {
            error: "The origin and destination station must not be the same",
        }
    );
export type RouteCreateOneDtoType = z.infer<typeof RouteCreateOneDto>;

export const RouteUpdateOneDto = z.object({
    id: z.uuid({ error: "ID must be an UUID string" }),
})
    .extend(RouteCreateOneDto.partial().shape)
    .refine(
        (data) => data.originId !== undefined || data.destinationId !== undefined || data.distanceKm !== undefined || data.estimatedMinutes !== undefined,
        {
            error: "At least 1 field must be provided",
        }
    )
    .refine(
        (data) => !(data.originId != undefined && data.destinationId != undefined) || data.originId !== data.destinationId,
        {
            error: "The origin and destination station must not be the same",
        }
    );
export type RouteUpdateOneDtoType = z.infer<typeof RouteUpdateOneDto>;

export const RouteDeleteOneDto = z.object({
    id: z.uuid({ error: "ID must be an UUID string" }),
});
export type RouteDeleteOneDtoType = z.infer<typeof RouteDeleteOneDto>;

export const RouteFindOneByIdDto = z.object({
    id: z.uuid({ error: "ID must be an UUID string" }),
});
export type RouteFindOneByIdDtoType = z.infer<typeof RouteFindOneByIdDto>;

export const RouteSearchDto = z.object({
    sortOriginName: sortOptions,
    sortDestinationName: sortOptions,
    originNameQuery: z.string().optional(),
    destinationNameQuery: z.string().optional(),
}).extend(PaginationDto.shape);
export type RouteSearchDtoType = z.infer<typeof RouteSearchDto>;