import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { PaymentMethod } from "./payment-method.entity";

export enum PaymentStatusEnum {
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
}

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
    @ManyToOne(() => PaymentMethod)
    @JoinColumn()
    method: PaymentMethod;

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