import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Station } from "./station.entity";

@Entity()
export class Route {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Station, { onDelete: "CASCADE" })
    @JoinColumn({ name: 'origin_id' })
    origin: Station;

    @ManyToOne(() => Station, { onDelete: "CASCADE" })
    @JoinColumn({ name: 'destination_id' })
    destination: Station;

    @Column()
    distanceKm: number;

    @Column()
    estimatedMinutes: number;
}