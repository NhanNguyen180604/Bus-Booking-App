import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class NotificationTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    stringTemplate: string;
}