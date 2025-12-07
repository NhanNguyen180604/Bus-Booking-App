import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { PaymentMethod } from "./payment-method.entity";
import { PaymentProviderEnum, PaymentStatusEnum } from "@repo/shared";

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

    // points to a user's payment method
    // just use JOIN on everything ahahahahhahahahahahahahah
    @ManyToOne(() => PaymentMethod, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    method: PaymentMethod;

    // for guest user
    @Column({ default: false })
    isGuestPayment: boolean;

    @Column({ nullable: true, type: 'enum', enum: PaymentProviderEnum })
    guestPaymentProvider: PaymentProviderEnum;
    // for guest user

    @Column({ type: 'decimal' })
    amount: number;

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