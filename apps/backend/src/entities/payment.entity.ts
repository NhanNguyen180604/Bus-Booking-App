import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { PaymentCancelReason, type PaymentCancelReasonType, PaymentProviderEnum, PaymentStatusEnum } from "@repo/shared";
import { User } from "./users.entity";
import { Booking } from "./booking.entity";

@Entity()
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: PaymentStatusEnum,
        default: PaymentStatusEnum.PROCESSING,
    })
    status: PaymentStatusEnum;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    user: User;

    @OneToOne(() => Booking, booking => booking.payment, { nullable: true })
    booking: Booking;

    @Column({ type: 'enum', enum: PaymentProviderEnum })
    paymentProvider: PaymentProviderEnum;

    @Column({ nullable: true })
    paymentTransactionId: string;

    @Column({ type: 'decimal' })
    amount: number;

    @Column({ nullable: true, type: 'enum', enum: PaymentCancelReason })
    cancellationReason?: PaymentCancelReasonType;

    @CreateDateColumn()
    createdAt: Date;

    @BeforeInsert()
    @BeforeUpdate()
    roundAmount() {
        if (this.amount) {
            this.amount = Math.ceil(this.amount);
        }
    }
}