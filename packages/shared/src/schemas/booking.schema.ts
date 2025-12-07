import z from 'zod';
import { sortOptions } from './common';

export enum PaymentProviderEnum {
    ZALO_PAY = 'ZALO_PAY',
    STRIPE = 'STRIPE',
    MOMO = 'MOMO',
    BANK = 'BANK',
}

const PaymentDetails = z.object({
    methodId: z.uuid({ error: 'Payment method ID must be a UUID string' }).optional(),
    isGuestPayment: z.boolean().optional(),
    guestPaymentProvider: z.enum(PaymentProviderEnum).optional(),
})
    .refine(({ methodId, isGuestPayment, guestPaymentProvider }) => {
        return (methodId && !isGuestPayment && !guestPaymentProvider) ||
            (!methodId && isGuestPayment && guestPaymentProvider);
    }, {
        error: 'Either methodId must be provided for registered users or isGuestPayment must be true for guest payments',
    });

export const BookingCreateOneDto = z.object({
    tripId: z.uuid({ error: 'Trip ID must be a UUID string' }),
    seatIds: z.array(z.uuid({ error: 'Seat ID must be a UUID string' })).min(1, { error: 'At least one seat must be selected' }),
    fullName: z.string().nonempty({ error: 'Full name is required' }),
    phone: z.string().nonempty({ error: 'Phone number is required' }),
    email: z.email({ error: 'Invalid email address' }).optional(),
    paymentDetails: PaymentDetails,
});
export type BookingCreateOneDtoType = z.infer<typeof BookingCreateOneDto>;

export const BookingConfirmDto = z.object({
    token: z.string(),
});
export type BookingConfirmDtoType = z.infer<typeof BookingConfirmDto>;

export const BookingLookUpDto = z.object({
    bookingCode: z.string().nonempty({ error: "Booking code is required" }),
    phone: z.string().nonempty({ error: 'Phone number is required' }),
});
export type BookingLookUpDtoType = z.infer<typeof BookingLookUpDto>;

export const BookingUserSearchDto = z.object({
    page: z.int().gte(1, { error: "Page number must be >= 1" }).default(1),
    perPage: z.int().gte(1, { error: "Per Page number must be >= 1" }).default(1),
    sortDate: sortOptions,
    sortPrice: sortOptions,
});
export type BookingUserSearchDtoType = z.infer<typeof BookingUserSearchDto>;