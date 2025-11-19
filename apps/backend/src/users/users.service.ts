import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { UserLoginDtoType, UserRegisterDtoType } from './users.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import bcryptjs from 'bcryptjs';
import { TRPCError } from '@trpc/server';
import { TokenService } from '../token/token.service';
import { Request } from 'express';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @Inject(forwardRef(() => TokenService))
        private readonly tokenService: TokenService,
    ) { }

    findOneBy(field: "id" | "email" | "phone", value: number | string) {
        return this.userRepo.findOneBy({
            [field]: value,
        });
    }

    async loginLocal(dto: UserLoginDtoType, req: Request): Promise<{ access_token: string, refresh_token?: string }> {
        const foundUser = await this.findOneBy('email', dto.email);
        if (!foundUser || !bcryptjs.compareSync(dto.password, foundUser.password)) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'Invalid login credentials',
            });
        }

        const tokens = this.tokenService.extractTokensFromCookies(req);
        if (tokens && tokens.refresh_token) {
            await this.tokenService.deleteOneRefreshTokenByValue(tokens.refresh_token);
            await this.tokenService.deleteOneRefreshTokenByUser(foundUser);
        }

        return this.createTokens(foundUser, dto.rememberMe);
    }

    async registerLocal(dto: UserRegisterDtoType): Promise<{ access_token: string, refresh_token?: string }> {
        const duplicateEmailUser = await this.findOneBy('email', dto.email);
        if (duplicateEmailUser) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: `User with this email "${dto.email}" already exists`
            });
        }

        const duplicatePhoneUser = await this.findOneBy('phone', dto.phone);
        if (duplicatePhoneUser) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: `User with this phone number "${dto.phone}" already exists`
            });
        }

        const salt = bcryptjs.genSaltSync();
        const hashedPassword = bcryptjs.hashSync(dto.password, salt);
        let newUser = this.userRepo.create({
            ...dto,
            password: hashedPassword,
        });

        newUser = await this.userRepo.save(newUser);
        return this.createTokens(newUser, dto.rememberMe);
    }

    async createTokens(user: User, rememberMe: boolean) {
        const access_token = await this.tokenService.createOneAccessToken(user);

        if (rememberMe) {
            const refresh_token = await this.tokenService.createOneRefreshToken(user);
            return { access_token, refresh_token };
        }

        return { access_token };
    }
}
