import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UserChangePasswordDtoType, UserForgetPasswordDtoType, UserLoginDtoType, UserRegisterDtoType, UserResetPasswordDtoType, UserRoleEnum, UserSearchDtoType, UserUpdateProfileDtoType, UserUploadAvatarDtoType } from '@repo/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginProviderEnum, User } from '../entities/users.entity';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import bcryptjs from 'bcryptjs';
import { TRPCError } from '@trpc/server';
import { TokenService } from '../token/token.service';
import { Request } from 'express';
import { Bus } from 'src/entities/bus.entity';
import { MyMailerService } from 'src/my-mailer/my-mailer.service';
import { AccessTokenPayload } from 'src/types/token-payload';
import { RootConfig } from 'src/config/config';
import { ResetPasswordToken } from 'src/entities/reset-password-token.entity';
import crypto from 'crypto';
import { convertToMs } from 'src/utils/convert-to-ms';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(ResetPasswordToken)
        private readonly resetPassTokenRepo: Repository<ResetPasswordToken>,
        @Inject(forwardRef(() => TokenService))
        private readonly tokenService: TokenService,
        private readonly mailerService: MyMailerService,
        @Inject(RootConfig)
        private readonly config: RootConfig,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    findOneBy(where: FindOptionsWhere<User> | FindOptionsWhere<User>[]) {
        return this.userRepo.findOneBy(where);
    }

    async createOne(user: DeepPartial<User>) {
        user = this.userRepo.create(user);
        return await this.userRepo.save(user) as User;
    }

    async loginLocal(dto: UserLoginDtoType, req: Request) {
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
        }

        const { verified } = foundUser;
        const newTokens: { access_token: string, refresh_token?: string } = await this.createTokens(foundUser, dto.rememberMe);

        return {
            ...newTokens,
            verified,
        };
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
            verified: false,
        });

        await this.sendEmailVerification(newUser);
        return this.createTokens(newUser, dto.rememberMe);
    }

    async sendEmailVerification(user: User) {
        if (user.provider.includes(LoginProviderEnum.LOCAL) && user.provider.includes(LoginProviderEnum.GOOGLE)) {
            return false;
        }

        const token = await this.tokenService.createOneEmailVerificationToken(user);
        const verificationLink = `${this.config.frontend_url}/users/verify-email?token=${token}`;
        await this.mailerService.sendGenericMail({
            to: user.email,
            subject: 'BusBus - Email Verification',
            template: 'email-verification',
            context: {
                headline: `Hi ${user.name},`,
                body: `Here is your email verification link. This will expire in 1 hour.`,
                link: verificationLink,
            },
        });

        return true;
    }

    async verifyEmail(user: User, token: string) {
        let payload: AccessTokenPayload;
        try {
            payload = await this.tokenService.verifyEmailVerificationToken(token);
        }
        catch (error: any) {
            if (error.name === "TokenExpiredError") {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Email verification link expired",
                });
            }
            else throw error;
        }

        if (payload.sub !== user.id) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: 'You are not allowed to verify another user\'s email',
            });
        }

        user.verified = true;
        await this.userRepo.save(user);
        return {
            success: true,
        };
    }

    async createTokens(user: User, rememberMe: boolean) {
        const access_token = await this.tokenService.createOneAccessToken(user);

        if (rememberMe) {
            const refresh_token = await this.tokenService.createOneRefreshToken(user);
            return { access_token, refresh_token };
        }

        return { access_token };
    }

    async search(dto: UserSearchDtoType) {
        const qb = this.userRepo
            .createQueryBuilder("u")
            .leftJoin(Bus, "b", "b.driverId = u.id");

        qb.select([
            "u.id",
            "u.name",
            "u.email",
            "u.phone",
            "u.role",
            "u.provider",
            "u.providerId",
            "u.createdAt",
        ]);

        if (dto.driverWithNoBus) {
            qb.andWhere("u.role = :role", { role: UserRoleEnum.DRIVER })
                .andWhere("b.id IS NULL");
        }

        if (dto.role && !dto.driverWithNoBus) {
            qb.andWhere("u.role = :role", { role: UserRoleEnum[dto.role] });
        }

        if (dto.nameQuery) {
            qb.andWhere("u.name ILIKE :name", { name: `%${dto.nameQuery}%` });
        }
        if (dto.phoneQuery) {
            qb.andWhere("u.phone ILIKE :phone", { phone: `%${dto.phoneQuery}%` });
        }
        if (dto.emailQuery) {
            qb.andWhere("u.email ILIKE :email", { email: `%${dto.emailQuery}%` });
        }

        if (dto.nameSort) qb.addOrderBy("u.name", dto.nameSort.toUpperCase() as "ASC" | "DESC");
        if (dto.phoneSort) qb.addOrderBy("u.phone", dto.phoneSort.toUpperCase() as "ASC" | "DESC");
        if (dto.emailSort) qb.addOrderBy("u.email", dto.emailSort.toUpperCase() as "ASC" | "DESC");

        qb.addOrderBy("u.createdAt", "DESC");

        qb.skip((dto.page - 1) * dto.perPage)
            .take(dto.perPage);

        const [users, count] = await qb.getManyAndCount();

        const totalPage = Math.ceil(count / dto.perPage);

        return {
            data: users,
            page: Math.min(dto.page, totalPage),
            perPage: dto.perPage,
            total: count,
            totalPage,
        };
    }

    async getAllDriversWithNoBus() {
        const drivers = await this.userRepo
            .createQueryBuilder('user')
            .leftJoin(Bus, "bus", "bus.driverId = user.id")
            .where("user.role = :role", { role: UserRoleEnum.DRIVER })
            .andWhere("bus.id IS NULL")
            .getMany();

        return drivers.map(driver => ({
            ...driver,
            password: '',
        })) as User[];
    }

    async changePassword(dto: UserChangePasswordDtoType, user: User) {
        if (!(await bcryptjs.compare(dto.oldPassword, user.password)))
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Incorrect old password",
            });

        if (dto.newPassword !== dto.confirmNewPassword)
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "New password does not match",
            });

        const salt = await bcryptjs.genSalt();
        const hashedPassword = await bcryptjs.hash(dto.newPassword, salt);
        user.password = hashedPassword;
        await this.userRepo.save(user);

        // delete old tokens
        await this.tokenService.deleteAllRefreshTokenByUser(user);
    }

    async updateProfile(dto: UserUpdateProfileDtoType, user: User) {
        user.name = dto.name;
        return await this.userRepo.save(user);
    }

    async sendResetPasswordEmail(dto: UserForgetPasswordDtoType) {
        const { email } = dto;
        const user = await this.findOneBy({ email });
        if (!user)
            throw new TRPCError({
                code: "NOT_FOUND",
                message: `User with email ${email} not found`,
            });

        crypto.randomBytes(256, async (err, buf) => {
            if (err) throw err;
            const token = buf.toString('hex');
            const resetTokenEntity = await this.resetPassTokenRepo.save({
                user,
                token,
                expiresAt: new Date(Date.now() + convertToMs('1h')),
            });

            const resetPasswordLink = `${this.config.frontend_url}/users/reset-password?token=${token}`;
            await this.mailerService.sendGenericMail({
                to: email,
                subject: 'BusBus - Reset password',
                template: 'email-verification',
                context: {
                    headline: `Hi,`,
                    body: `Here is your password reset link. This will expire in 1 hour.`,
                    link: resetPasswordLink,
                },
            });
        });
    }

    async resetPassword(dto: UserResetPasswordDtoType) {
        const tokenEntity = await this.resetPassTokenRepo
            .createQueryBuilder('resetToken')
            .leftJoinAndSelect('resetToken.user', 'user')
            .where('resetToken.token = :value', { value: dto.token })
            .andWhere('resetToken.expiresAt > NOW()')
            .getOne();
        if (!tokenEntity)
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Token expired or not found",
            });

        const { user } = tokenEntity;
        if (!user)
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "User not found",
            });

        if (dto.newPassword !== dto.confirmNewPassword)
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Password does not match",
            });

        const salt = await bcryptjs.genSalt();
        const hashedPassword = await bcryptjs.hash(dto.newPassword, salt);
        user.password = hashedPassword;
        await this.userRepo.save(user);
        await this.resetPassTokenRepo.delete(tokenEntity);
    }

    async uploadAvatar(dto: UserUploadAvatarDtoType, user: User) {
        try {
            const { public_id, secure_url } = await this.cloudinaryService.uploadOneImage(dto.avatar, `users/${user.id}/avatar`);
            if (user.avatarPublicID) await this.cloudinaryService.deleteResources([user.avatarPublicID]);
            user.avatarPublicID = public_id;
            user.avatarUrl = secure_url;
            await this.userRepo.save(user);
            return { url: secure_url };
        }
        catch (error) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: error.message,
            });
        }
    }
}
