import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Trip } from "./trip.entity";
import { Seat } from "./seat.entity";
import { PassengerDetails } from "./passenger-details.entity";
import { Payment } from "./payment.entity";

@Entity()
export class Booking {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => PassengerDetails)
    @JoinColumn()
    passengerDetails: PassengerDetails;

    @ManyToOne(() => Trip)
    @JoinColumn()
    trip: Trip;

    @ManyToMany(() => Seat)
    @JoinTable()
    seats: Seat[];

    @Column({ type: 'decimal' })
    totalPrice: number;

    @OneToOne(() => Payment)
    @JoinColumn()
    payment: Payment;

    @CreateDateColumn()
    createdAt: Date;
}