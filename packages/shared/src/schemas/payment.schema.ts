import z from 'zod';
import { PaymentProviderEnum, PaymentStatusEnum } from './booking.schema';
import { sortOptions } from './common';

export const PaymentSearchDto = z.object({
    page: z.number().int().positive().default(1),
    perPage: z.number().int().positive().default(20),
    status: z.enum(PaymentStatusEnum).optional(),
    paymentProvider: z.enum(PaymentProviderEnum).optional(),
    createdAt: z.string().optional(),
    transactionId: z.string().optional(),
    sortBy: z.enum(['amount', 'createdAt', 'status']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type PaymentSearchDtoType = z.infer<typeof PaymentSearchDto>;
