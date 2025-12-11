// import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
// import { User } from "./users.entity";
// import { PaymentProviderEnum } from "@repo/shared";

// @Entity()
// export class PaymentMethod {
//     @PrimaryGeneratedColumn('uuid')
//     id: string;

//     @ManyToOne(() => User)
//     @JoinColumn()
//     user: User;

//     @Column({
//         type: 'enum',
//         enum: PaymentProviderEnum,
//         default: PaymentProviderEnum.BANK,
//     })
//     provider: PaymentProviderEnum;

//     @Column()
//     token: string;

//     @Column({ default: false })
//     isDefault: boolean;

//     @CreateDateColumn()
//     createdAt: Date;
// }
