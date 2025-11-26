import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './refresh-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/users.entity';
import { type Request } from 'express';
import { RootConfig } from '../config/config';
import { convertToMs } from '../utils/convert-to-ms';
import { AccessTokenPayload } from '../types/token-payload';

@Injectable()
export class TokenService {
    constructor(
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
        @Inject('ACCESS_JWT')
        private readonly accessJwtService: JwtService,
        @Inject('REFRESH_JWT')
        private readonly refreshJwtService: JwtService,
        @InjectRepository(RefreshToken)
        private readonly tokenRepo: Repository<RefreshToken>,
        @Inject(RootConfig)
        private readonly config: RootConfig,
    ) { }

    async findOneBy(field: "userId" | "value", value: string) {
        // return this.tokenRepo.findOneBy({ 
        //     [field]: value
        // });
        return this.tokenRepo.createQueryBuilder("token")
            .where(`token.${field} = :value`, { value })
            .andWhere("token.deleteDate > NOW()")
            .getOne();
    }

    async createOneAccessToken(user: string | User) {
        if (typeof (user) === 'string') {
            user = (await this.usersService.findOneBy({ id: user }))!;
        }
        const payload: AccessTokenPayload = { sub: user.id, email: user.email };
        const access_token = this.accessJwtService.sign(payload);
        return access_token;
    }

    async createOneRefreshToken(user: string | User) {
        if (typeof (user) === 'string') {
            user = (await this.usersService.findOneBy({ id: user }))!;
        }
        const refresh_token = this.refreshJwtService.sign({ sub: user.id });

        const refreshTokenEntity = this.tokenRepo.create({
            user,
            value: refresh_token,
            deleteDate: new Date(Date.now() + convertToMs(this.config.jwt.refresh_token.expires_in))
        });
        await this.tokenRepo.save(refreshTokenEntity);
        return refresh_token;
    }

    async deleteOneRefreshTokenByUser(user: string | User) {
        if (typeof (user) === 'string') {
            user = (await this.usersService.findOneBy({ id: user }))!;
        }
        await this.tokenRepo.delete({ user });
    }

    async deleteOneRefreshTokenByValue(value: string) {
        await this.tokenRepo.delete({ value });
    }

    extractTokensFromCookies(req: Request) {
        if (!req.signedCookies) {
            return null;
        }

        const result: { access_token: string | null, refresh_token: string | null } = {
            access_token: null,
            refresh_token: null,
        };

        if (req.signedCookies.access_token) {
            result.access_token = req.signedCookies.access_token as string;
        }
        if (req.signedCookies.refresh_token) {
            result.refresh_token = req.signedCookies.refresh_token as string;
        }

        return result;
    }
}
