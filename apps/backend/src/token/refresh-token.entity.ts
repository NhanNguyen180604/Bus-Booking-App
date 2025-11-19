import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "../users/users.entity";

@Entity()
export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn()
    user: User;

    @Column({ nullable: false })
    value: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @DeleteDateColumn({ type: 'timestamptz' })
    deleteDate: Date;
}