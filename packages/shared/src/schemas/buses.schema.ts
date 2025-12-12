import z from "zod";
import { PaginationDto, sortOptions } from "./common";

export enum SeatTypeEnum {
    DRIVER = 'DRIVER',
    PASSENGER = 'PASSENGER',
};

// create bus without seat
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
    // rowSpan: z.int().gte(1, { error: "Row span must be >= 1" }),
    col: z.int().gte(0, { error: "Col index must be >= 0" }),
    // colSpan: z.int().gte(1, { error: "Col span must be >= 1" }),
    floor: z.int().gte(0, { error: "Floor index must be >= 0" }),
    seatType: z.enum(SeatTypeEnum),
});
export type BusSeatCreateOneDtoType = z.infer<typeof BusSeatCreateOneDto>;

// add many seats
export const BusAddSeatsDto = z.object({
    busId: z.uuid({ error: "Bus ID must be an UUID string" }),
    seats: z.array(BusSeatCreateOneDto).min(1, { error: "Array must not be empty" }),
});
export type BusAddSeatsDtoType = z.infer<typeof BusAddSeatsDto>;

// create bus and seats
export const BusCreateOneWithSeatsDto = z.object({
    bus: z.object().extend(BusCreateOneDto.shape),
    seats: z.array(BusSeatCreateOneDto).min(2, { error: "Array length must be >= 2, 1 for the driver and 1 for the passenger >:(" }),
})
    .refine((data) => {
        let driverSeatCount = 0;
        data.seats.forEach((seat) => {
            if (seat.seatType === SeatTypeEnum.DRIVER)
                driverSeatCount++;
        });
        return driverSeatCount === 1;
    }, {
        error: "There must be a seat for driver",
        path: ["seats"],
    })
    .refine((data) => {
        const totalFloors = data.bus.floors;

        // count seats per floor
        const floorSeatCount = Array.from({ length: totalFloors }, () => 0);

        data.seats.forEach((seat) => {
            if (seat.floor >= 0 && seat.floor < totalFloors) {
                floorSeatCount[seat.floor]++;
            }
        });

        // every floor must have >= 1 seat
        return floorSeatCount.every(count => count > 0);
    }, {
        error: "Each floor must have at least 1 seat",
        path: ["seats"]
    });
export type BusCreateOneWithSeatsDtoType = z.infer<typeof BusCreateOneWithSeatsDto>;


export const BusGetSeatsByBusIdDto = z.object({
    id: z.uuid({ error: "Bus ID must be an UUID string" }),
});
export type BusGetSeatsByBusIdDtoType = z.infer<typeof BusGetSeatsByBusIdDto>;

export const BusGetOneByIdDto = z.object({
    id: z.uuid({ error: "ID must be an UUID string" }),
});
export type BusGetOneByIdDtoType = z.infer<typeof BusGetOneByIdDto>;

export const BusSearchDto = z.object({
    driverNotNull: z.boolean().optional(),
    driverId: z.uuid({ error: "Driver ID must be an UUID string" }).optional(),
    driverNameSort: sortOptions,
    plateNumberQuery: z.string().optional(),
    plateNumberSort: sortOptions,
    typeId: z.uuid({ error: "Bus Type ID must be an UUID string" }).optional(),
}).extend(PaginationDto.shape);
export type BusSearchDtoType = z.infer<typeof BusSearchDto>;

export const BusDeleteOneDto = z.object({
    id: z.uuid({ error: "ID must be an UUID string" }),
});
export type BusDeleteOneDtoType = z.infer<typeof BusDeleteOneDto>;


export const BusSeatsGetManyByIdsDto = z.object({
    ids: z.array(z.uuid({ error: "Seat ID must be an UUID string" })).min(1, { error: "Array must not be empty" }),
});
export type BusSeatsGetManyByIdsDtoType = z.infer<typeof BusSeatsGetManyByIdsDto>;