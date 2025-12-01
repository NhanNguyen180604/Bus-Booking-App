import z from "zod";

export const BusCreateOneDto = z.object({
    driverId: z.uuid({ error: "Driver ID must be an UUID string" }).optional(),
    plateNumber: z.string().trim().nonempty({ error: "Plate number must not be empty" }),
    busTypeId: z.uuid({ error: "Bus type ID must be an UUID string" }),
    rows: z.int().gt(0, { error: "Rows must be greater than 0" }),
    cols: z.int().gt(0, { error: "Cols must be greater than 0" }),
    floors: z.int().gt(0, { error: "Floors must be greater than 0" }),
});
export type BusCreateOneDtoType = z.infer<typeof BusCreateOneDto>;

export const BusSeatCreateOneDto = z.object({
    row: z.int().gte(0, { error: "Row index must be >= 0" }),
    rowSpan: z.int().gte(1, { error: "Row span must be >= 1" }),
    col: z.int().gte(0, { error: "Col index must be >= 0" }),
    colSpan: z.int().gte(1, { error: "Col span must be >= 1" }),
    floor: z.int().gte(0, { error: "Floor index must be >= 0" }),
});
export type BusSeatCreateOneDtoType = z.infer<typeof BusSeatCreateOneDto>;

export const BusAddSeatsDto = z.object({
    busId: z.uuid({ error: "Bus ID must be an UUID string" }),
    seats: z.array(BusSeatCreateOneDto).min(1, { error: "Array must not be empty" })
});
export type BusAddSeatsDtoType = z.infer<typeof BusAddSeatsDto>;

export const BusGetSeatsByBusIdDto = z.object({
    id: z.uuid({ error: "Bus ID must be an UUID string" }),
});
export type BusGetSeatsByBusIdDtoType = z.infer<typeof BusGetSeatsByBusIdDto>;