import { BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Trip } from "./trip.entity";
import { Seat } from "./seat.entity";
import { Payment } from "./payment.entity";
import { User } from "./users.entity";
import { createHash, randomBytes } from "crypto";

@Entity()
export class Booking {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    lookupCode: string;

    @ManyToOne(() => Trip)
    @JoinColumn()
    trip: Trip;

    @ManyToMany(() => Seat)
    @JoinTable()
    seats: Seat[];

    @Column()
    fullName: string;

    @Column()
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Column({ type: 'decimal' })
    totalPrice: number;

    @OneToOne(() => Payment, { onDelete: 'CASCADE' })
    @JoinColumn()
    payment: Payment;

    @CreateDateColumn()
    createdAt: Date;

    // no longer confirm token, but the token used to create qr code
    @Column()
    token: string;

    @Column({ default: null, nullable: true })
    cancelToken: string;

    // null if success payment
    @Column({ type: 'timestamptz', nullable: true })
    expiresAt: Date | null;

    @BeforeInsert()
    generateLookupCode() {
        // 1. 4-char hash from the trip ID (stable, readable)
        const tripPart = createHash("sha1")
            .update(this.trip.id)
            .digest("base64url")
            .slice(0, 4)
            .toUpperCase();

        // 2. Date part: yyMMdd
        const now = new Date();
        const yy = String(now.getFullYear()).slice(2);
        const MM = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const datePart = `${yy}${MM}${dd}`;

        // 3. 4-char random readable suffix (A–Z + 0–9)
        const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoids 0/O/1/I confusion
        const randomBytesBuf = randomBytes(4);
        let randomPart = "";
        for (let i = 0; i < 4; i++) {
            randomPart += alphabet[randomBytesBuf[i] % alphabet.length];
        }

        this.lookupCode = `${tripPart}-${datePart}-${randomPart}`;
    }
}