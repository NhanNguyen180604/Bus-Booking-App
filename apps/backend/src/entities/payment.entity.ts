import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { PaymentProviderEnum, PaymentStatusEnum } from "@repo/shared";
import { User } from "./users.entity";

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

    @Column({ type: 'enum', enum: PaymentProviderEnum })
    paymentProvider: PaymentProviderEnum;

    @Column({ nullable: true })
    paymentTransactionId: string;

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