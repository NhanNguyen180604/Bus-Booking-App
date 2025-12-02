import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./users.entity";

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

    // to be deleted date
    @Column({ type: 'timestamptz' })
    deleteDate: Date;
}