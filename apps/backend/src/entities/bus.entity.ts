import { Check, Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./users.entity";
import { BusType } from "./bus-type.entity";

@Entity()
@Check('"rows" > 0')
@Check('"cols" > 0')
@Check('"floors" > 0')
export class Bus {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User)
    driver: User;

    @Column()
    plateNumber: string;

    @ManyToOne(() => BusType)
    type: BusType;

    @Column()
    seatCapacity: number;

    // seat layout
    @Column()
    rows: number;

    @Column()
    cols: number;

    @Column()
    floors: number;
};