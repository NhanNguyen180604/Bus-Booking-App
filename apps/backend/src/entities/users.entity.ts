import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum UserRoleEnum {
    USER = 'USER',
    ADMIN = 'ADMIN',
    DRIVER = 'DRIVER',
    GUEST = 'GUEST',  // do not use this for account role
};

export enum LoginProviderEnum {
    LOCAL = 'LOCAL',
    GOOGLE = 'GOOGLE',
    FACEBOOK = 'FACEBOOK',
    GITHUB = 'GITHUB',
};

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, nullable: true })
    email: string;

    @Column({ unique: true, nullable: true })
    phone: string;

    @Column({ nullable: true })
    password: string;  // null if provider is not local

    @Column({
        type: 'enum',
        array: true,
        enum: LoginProviderEnum,
        default: [LoginProviderEnum.LOCAL],
    })
    provider: LoginProviderEnum[];  // i wont change the name to plural, I DONT WANT TO DEAL WITH THIS ANYMORE AAGJHSD

    @Column({ nullable: true })
    providerId: string;  // null if provider is local

    @Column({ nullable: false })
    name: string;

    @Column({
        type: 'enum',
        enum: UserRoleEnum,
        default: UserRoleEnum.USER,
    })
    role: UserRoleEnum;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ default: false })
    verified: boolean;
}