import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./users.entity";

@Entity()
export class PassengerDetails {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { nullable: true })  // null if the user is not logged in
    @JoinColumn()
    user: User;

    @Column()
    fullName: string;

    @Column({ nullable: true })  // not null if the user is not logged in, phone number must be provided
    phone: string;
}