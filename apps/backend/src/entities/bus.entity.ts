import { Check, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./users.entity";
import { BusType } from "./bus-type.entity";

@Entity()
@Check('"rows" > 0')
@Check('"cols" > 0')
@Check('"floors" > 0')
export class Bus {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn()
    driver: User;

    @Column({ unique: true })
    plateNumber: string;

    @ManyToOne(() => BusType, { onDelete: "CASCADE" })
    @JoinColumn()
    type: BusType;

    // seat layout
    @Column()
    rows: number;

    @Column()
    cols: number;

    @Column()
    floors: number;
};