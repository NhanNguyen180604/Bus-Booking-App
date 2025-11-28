import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./users.entity";

export enum PaymentProviderEnum {
    ZALO_PAY = 'ZALO_PAY',
    STRIPE = 'STRIPE',
    MOMO = 'MOMO',
    BANK = 'BANK',
}

@Entity()
export class PaymentMethod {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn()
    user: User;

    @Column({
        type: 'enum',
        enum: PaymentProviderEnum,
        default: PaymentProviderEnum.BANK,
    })
    provider: PaymentProviderEnum;

    @Column()
    token: string;

    @Column({ default: false })
    isDefault: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
