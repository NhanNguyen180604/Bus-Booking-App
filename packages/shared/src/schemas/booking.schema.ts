import z from 'zod';
import { sortOptions } from './common';

export enum PaymentProviderEnum {
    STRIPE = 'STRIPE',
    BANK = 'BANK',
}

export enum PaymentStatusEnum {
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    EXPIRED = 'EXPIRED',
    REFUNDED = 'REFUNDED',
}

export const PaymentCancelReason = [
    'Requested by customer',
    'Urgent schedule',
    'Other',
    'Out of seats due to deactivating',
    'No reserved bus to stand in for the trip'
] as const;
export type PaymentCancelReasonType = typeof PaymentCancelReason[number];

export const BookingCreateOneDto = z.object({
    tripId: z.uuid({ error: 'Trip ID must be a UUID string' }),
    seatIds: z.array(z.uuid({ error: 'Seat ID must be a UUID string' })).min(1, { error: 'At least one seat must be selected' }),
    fullName: z.string().trim().nonempty({ error: 'Full name is required' }),
    phone: z.string().trim().nonempty({ error: 'Phone number is required' }),
    // https://github.com/colinhacks/zod/issues/2513#issuecomment-1732405993
    // what in the hell
    email: z.email(),
    paymentProvider: z.enum(PaymentProviderEnum),
});
export type BookingCreateOneDtoType = z.infer<typeof BookingCreateOneDto>;

export const BookingLookUpDto = z.object({
    bookingCode: z.string().trim().nonempty({ error: "Booking code is required" }),
    phone: z.string().trim().nonempty({ error: 'Phone number is required' }),
});
export type BookingLookUpDtoType = z.infer<typeof BookingLookUpDto>;

export const BookingUserSearchDto = z.object({
    page: z.int().gte(1, { error: "Page number must be >= 1" }).default(1),
    perPage: z.int().gte(1, { error: "Per Page number must be >= 1" }).default(1),
    sortDate: sortOptions,
    sortPrice: sortOptions,
    upcoming: z.boolean().optional().default(false),
    completed: z.boolean().optional().default(false),
});
export type BookingUserSearchDtoType = z.infer<typeof BookingUserSearchDto>;

export const GetBookingSeatsByTripDto = z.object({
    tripId: z.uuid({ error: "Trip ID must be a UUID string" }),
});
export type GetBookingSeatsByTripDtoType = z.infer<typeof GetBookingSeatsByTripDto>;

export const BookingCancelDto = z.object({
    cancelToken: z.string().trim().nonempty(),
    cancelReason: z.enum(PaymentCancelReason),
});
export type BookingCancelDtoType = z.infer<typeof BookingCancelDto>;

export const BookingUpdateDto = z.object({
    bookingId: z.uuid({ error: 'Booking ID must be a UUID string' }),
    seatIds: z.array(z.uuid({ error: 'Seat ID must be a UUID string' })).min(1, { error: 'At least one seat must be selected' }).optional(),
    fullName: z.string().trim().nonempty({ error: 'Full name is required' }).optional(),
    phone: z.string().trim().nonempty({ error: 'Phone number is required' }).optional(),
    email: z.email({ error: 'Invalid email address' }).trim().nonempty({ error: 'Email is required' }).optional(),
});
export type BookingUpdateDtoType = z.infer<typeof BookingUpdateDto>;

export const BookingFindOneByIdDto = z.object({
    id: z.uuid({ error: 'Booking ID must be a UUID string' }),
});
export type BookingFindOneByIdDtoType = z.infer<typeof BookingFindOneByIdDto>;

export const BookingCheckInDto = z.object({
    bookingId: z.uuid(),
    checkedIn: z.boolean(),
});
export type BookingCheckInDtoType = z.infer<typeof BookingCheckInDto>;