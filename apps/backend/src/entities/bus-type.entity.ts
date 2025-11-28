import { Check, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
@Check('"priceMultiplier" >= 1')
export class BusType {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ type: 'real' })
    priceMultiplier: number;
};