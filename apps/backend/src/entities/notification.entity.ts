import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Booking } from "./booking.entity";

export enum NotificationTypeEnum {
    UPCOMING_TRIP_REMINDER = 'UPCOMING_TRIP_REMINDER',
    POST_TRIP_THANK_YOU = 'POST_TRIP_THANK_YOU',
}

@Entity()
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Booking)
    @JoinColumn({ name: 'bookingId' })
    booking: Booking;

    @Column()
    message: string;

    @Column({ type: 'enum', enum: NotificationTypeEnum })
    type: NotificationTypeEnum;

    @CreateDateColumn()
    createdAt: Date;
}