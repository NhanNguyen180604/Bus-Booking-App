import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Trip } from "./trip.entity";
import { Seat } from "./seat.entity";
import { Payment } from "./payment.entity";
import { User } from "./users.entity";

@Entity()
export class Booking {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Trip)
    @JoinColumn()
    trip: Trip;

    @ManyToMany(() => Seat)
    @JoinTable()
    seats: Seat[];

    @ManyToOne(() => User, { nullable: true })  // null if the user is not logged in
    @JoinColumn()
    user: User;

    @Column()
    fullName: string;

    @Column()
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Column({ type: 'decimal' })
    totalPrice: number;

    @OneToOne(() => Payment)
    @JoinColumn()
    payment: Payment;

    @CreateDateColumn()
    createdAt: Date;
}