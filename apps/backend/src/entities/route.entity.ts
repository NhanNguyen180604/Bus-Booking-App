import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Station } from "./station.entity";

@Entity()
export class Route {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Station)
    @JoinColumn({ name: 'origin_id' })
    origin: Station;

    @ManyToOne(() => Station)
    @JoinColumn({ name: 'destination_id' })
    destination: Station;

    @Column()
    distanceKm: number;

    @Column()
    estimatedMinutes: number;
}