import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Route } from "./route.entity";
import { Bus } from "./bus.entity";
import { User } from "./users.entity";

@Entity()
export class Trip {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Route, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: 'route_id' })
    route: Route;

    @ManyToOne(() => Bus, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: 'bus_id' })
    bus: Bus;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'driver_id' })
    driver: User;

    @Column({ type: 'timestamptz' })
    departureTime: Date;

    @Column({ type: 'timestamptz' })
    arrivalTime: Date;

    // per seat
    // total price = number of seats ordered * basePrice * bus type's price multiplier
    @Column({ type: 'decimal' })
    basePrice: number;

    @BeforeInsert()
    @BeforeUpdate()
    roundPrice() {
        if (this.basePrice) {
            this.basePrice = Math.ceil(this.basePrice);
        }
    }
}