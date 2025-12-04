import z from "zod";
import { PaginationDto } from "./common";

export const TripCreateOneDto = z.object({
    routeId: z.uuid({ error: "Origin must be an UUID string" }),
    busId: z.uuid({ error: "Destination must be an UUID string" }),
    departureTime: z.preprocess((val) => {
        if (typeof val === "string") {
            return new Date(val);
        }
        return val;
    }, z.date({ error: "Departure time must be a valid datetime" })),
    arrivalTime: z.preprocess((val) => {
        if (typeof val === "string") {
            return new Date(val);
        }
        return val;
    }, z.date({ error: "Arrival time must be a valid datetime" })),
    basePrice: z.int().gte(0, { error: "Base price must be >= 0" }),
})
    .refine(
        (data) => data.departureTime < data.arrivalTime,
        {
            error: "The departure time must be before the arrival time",
        }
    );
export type TripCreateOneDtoType = z.infer<typeof TripCreateOneDto>;

export const TripUpdateOneDto = z.object({
    id: z.uuid({ error: "ID must be an UUID string" }),
})
    .extend(TripCreateOneDto.partial().shape)
    .refine(
        (data) => data.routeId !== undefined || data.busId !== undefined || data.departureTime !== undefined || data.arrivalTime !== undefined,
        {
            error: "At least 1 field must be provided",
        }
    )
    .refine(
        (data) => !(data.departureTime !== undefined && data.arrivalTime !== undefined) || data.departureTime < data.arrivalTime,
        {
            error: "The departure time must be before the arrival time",
        }
    );
export type TripUpdateOneDtoType = z.infer<typeof TripUpdateOneDto>;

export const TripDeleteOneDto = z.object({
    id: z.uuid({ error: "ID must be an UUID string" }),
});
export type TripDeleteOneDtoType = z.infer<typeof TripDeleteOneDto>;

export const TripFindOneByIdDto = z.object({
    id: z.uuid({ error: "ID must be an UUID string" }),
});
export type TripFindOneByIdDtoType = z.infer<typeof TripFindOneByIdDto>;

export const TripFindManyDto = z.object({
    origin: z.uuid().optional(),
    destination: z.uuid().optional(),
    departureTime: z.preprocess((val) => {
        if (typeof val === "string") {
            return new Date(val);
        }
        return val;
    }, z.date({ error: "Departure time must be a valid datetime" })).optional(),
    busType: z.array(z.uuid()).optional(),
    minPrice: z.number().int().optional(),
    maxPrice: z.number().int().optional(),
    sortPrice: z.enum(['ASC', 'DESC']).optional(),
    sortDepartureTime: z.enum(['ASC', 'DESC']).optional(),
})
    .extend(PaginationDto.shape)
    .refine(
        (data) => data.origin !== undefined || data.destination !== undefined,
        {
            error: "At least 1 field must be provided",
        }
    )
    .refine(
        (data) => data.origin !== data.destination,
        {
            error: "The origin and destination station must not be the same",
        }
    )
export type TripFindManyDtoType = z.infer<typeof TripFindManyDto>;