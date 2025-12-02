import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Bus } from "./bus.entity";

export const UNIQUE_BUS_SEAT_CODE_CONSTRAINT = 'unique_bus_seat_code_constraint';
export const UNIQUE_BUS_SEAT_POSITION = 'unique_bus_seat_position';

@Entity()
@Unique(UNIQUE_BUS_SEAT_CODE_CONSTRAINT, ['bus', 'code'])
@Unique(UNIQUE_BUS_SEAT_POSITION, ['bus', 'row', 'col', 'floor'])
@Check('"row" >= 0')
@Check('"col" >= 0')
@Check('"floor" >= 0')
@Check('"rowSpan" >= 1')
@Check('"colSpan" >= 1')
export class Seat {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Bus, { onDelete: "CASCADE" })
    @JoinColumn()
    bus: Bus;

    @Column()
    code: string;

    // seat layout
    @Column()
    row: number;
    @Column()
    rowSpan: number;

    @Column()
    col: number;
    @Column()
    colSpan: number;

    @Column()
    floor: number;

    @Column({ default: true })
    isActive: boolean;
}