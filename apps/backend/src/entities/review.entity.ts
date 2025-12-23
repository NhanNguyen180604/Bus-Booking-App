import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Trip } from "./trip.entity";
import { User } from "./users.entity";
import { Booking } from "./booking.entity";

@Entity()
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
    @JoinColumn()
    trip: Trip;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
    @JoinColumn()
    booking: Booking;

    @Column({ type: 'int' })
    rating: number; // 1-5 stars

    @Column({ type: 'text' })
    comment: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
