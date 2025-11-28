import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Station{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;
}