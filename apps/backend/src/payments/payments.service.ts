import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Payment } from 'src/entities/payment.entity';
import { PaymentSearchDtoType } from '@repo/shared';

@Injectable()
export class PaymentsService {
    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    async searchPayments(dto: PaymentSearchDtoType) {
        const queryBuilder = this.entityManager
            .getRepository(Payment)
            .createQueryBuilder('payment')
            .leftJoinAndSelect('payment.user', 'user')
            .leftJoin('payment.booking', 'booking')
            .addSelect(['booking.id', 'booking.lookupCode']);

        // Filter by status
        if (dto.status) {
            queryBuilder.andWhere('payment.status = :status', { status: dto.status });
        }

        // Filter by payment provider
        if (dto.paymentProvider) {
            queryBuilder.andWhere('payment.paymentProvider = :paymentProvider', { 
                paymentProvider: dto.paymentProvider 
            });
        }

        // Filter by creation date
        if (dto.createdAt) {
            const date = new Date(dto.createdAt);
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            
            queryBuilder.andWhere('payment.createdAt >= :startOfDay', { startOfDay });
            queryBuilder.andWhere('payment.createdAt <= :endOfDay', { endOfDay });
        }

        // Search by transaction ID
        if (dto.transactionId) {
            queryBuilder.andWhere('payment.paymentTransactionId ILIKE :transactionId', {
                transactionId: `%${dto.transactionId}%`
            });
        }

        // Sorting
        if (dto.sortBy) {
            const order = dto.sortOrder === 'desc' ? 'DESC' : 'ASC';
            
            switch (dto.sortBy) {
                case 'amount':
                    queryBuilder.orderBy('payment.amount', order);
                    break;
                case 'createdAt':
                    queryBuilder.orderBy('payment.createdAt', order);
                    break;
                case 'status':
                    queryBuilder.orderBy('payment.status', order);
                    break;
                default:
                    queryBuilder.orderBy('payment.createdAt', 'DESC');
            }
        } else {
            queryBuilder.orderBy('payment.createdAt', 'DESC');
        }

        // Pagination
        const total = await queryBuilder.getCount();
        const totalPage = Math.ceil(total / dto.perPage);

        const data = await queryBuilder
            .skip((dto.page - 1) * dto.perPage)
            .take(dto.perPage)
            .getMany();

        return {
            data,
            total,
            page: dto.page,
            perPage: dto.perPage,
            totalPage,
        };
    }
}
