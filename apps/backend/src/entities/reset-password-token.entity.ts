import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./users.entity";

@Entity()
export class ResetPasswordToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn()
    user: User;

    @Column()
    token: string;

    @Column({ type: 'timestamptz' })
    expiresAt: Date;
}