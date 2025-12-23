import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class BusType {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;
};