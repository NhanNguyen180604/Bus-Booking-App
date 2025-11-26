import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { UserLoginDtoType, UserRegisterDtoType } from '@repo/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
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

    findOneBy(where: FindOptionsWhere<User> | FindOptionsWhere<User>[]) {
        return this.userRepo.findOneBy(where);
    }

    async createOne(user: DeepPartial<User>) {
        user = this.userRepo.create(user);
        return await this.userRepo.save(user) as User;
    }

    async loginLocal(dto: UserLoginDtoType, req: Request): Promise<{ access_token: string, refresh_token?: string }> {
        const foundUser = await this.findOneBy({ email: dto.email });
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
        const duplicateEmailUser = await this.findOneBy({ email: dto.email });
        if (duplicateEmailUser) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: `User with this email "${dto.email}" already exists`
            });
        }

        const duplicatePhoneUser = await this.findOneBy({ phone: dto.phone });
        if (duplicatePhoneUser) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: `User with this phone number "${dto.phone}" already exists`
            });
        }

        const salt = await bcryptjs.genSalt();
        const hashedPassword = await bcryptjs.hash(dto.password, salt);
        let newUser = await this.createOne({
            ...dto,
            password: hashedPassword,
        });

        return this.createTokens(newUser, dto.rememberMe);
    }

    logout(user: User) {
        this.tokenService.deleteOneRefreshTokenByUser(user);
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
