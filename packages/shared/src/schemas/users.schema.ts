import z from "zod";
import { PaginationDto, sortOptions } from "./common";

export enum UserRoleEnum {
    USER = 'USER',
    ADMIN = 'ADMIN',
    DRIVER = 'DRIVER',
    GUEST = 'GUEST',  // do not use this for account role
};

// local login
export const UserLoginDto = z.object({
    email: z.email(),
    password: z.string().trim().min(8, 'Password must be at least 8 characters'),
    rememberMe: z.boolean(),
});
export type UserLoginDtoType = z.infer<typeof UserLoginDto>;

// local register
export const UserRegisterDto = z.object({
    email: z.email(),
    // TODO: phone validation?
    phone: z.string().min(8),
    password: z.string().trim().min(8).regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
        "Password should have a min length of 8, contain both lower and uppercase, be alpha-numeric and contain at least 1 symbol"
    ),
    confirmPassword: z.string().min(8).regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
        "Password should have a min length of 8, contain both lower and uppercase, be alpha-numeric and contain at least 1 symbol"
    ),
    name: z
        .string()
        .min(1, "Display name should not be empty")
        .max(30, "Display name should not be longer than 30 characters"),
    rememberMe: z.boolean(),
})
    .refine((data) => data.password === data.confirmPassword, {
        message: "Password does not match",
        path: ["confirmPassword"],
    });
export type UserRegisterDtoType = z.infer<typeof UserRegisterDto>;

export const UserSearchDto = z.object({
    role: z.enum(["USER", "DRIVER"]).optional(),
    driverWithNoBus: z.boolean().optional(),
    nameQuery: z.string().trim().optional(),
    nameSort: sortOptions,
    phoneQuery: z.string().trim().optional(),
    phoneSort: sortOptions,
    emailQuery: z.email().trim().optional(),
    emailSort: sortOptions,
}).extend(PaginationDto.shape);
export type UserSearchDtoType = z.infer<typeof UserSearchDto>;

export const UserVerifyEmailDto = z.object({
    token: z.string().trim().nonempty(),
});
export type UserVerifyEmailDtoType = z.infer<typeof UserVerifyEmailDto>;

export const UserChangePasswordDto = z.object({
    oldPassword: z.string().trim().min(8).regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
        "Password should have a min length of 8, contain both lower and uppercase, be alpha-numeric and contain at least 1 symbol"
    ),
    newPassword: z.string().trim().min(8).regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
        "Password should have a min length of 8, contain both lower and uppercase, be alpha-numeric and contain at least 1 symbol"
    ),
    confirmNewPassword: z.string().trim().min(8).regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
        "Password should have a min length of 8, contain both lower and uppercase, be alpha-numeric and contain at least 1 symbol"
    ),
})
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        error: "New password does not match",
    })
    .refine((data) => data.newPassword !== data.oldPassword, {
        error: "Password must be anew",
    });
export type UserChangePasswordDtoType = z.infer<typeof UserChangePasswordDto>;

export const UserUpdateProfileDto = z.object({
    name: z.string().trim().min(1, { error: "Name must not be empty" }),
});
export type UserUpdateProfileDtoType = z.infer<typeof UserUpdateProfileDto>;

export const UserForgetPasswordDto = z.object({
    email: z.email().trim().nonempty(),
});
export type UserForgetPasswordDtoType = z.infer<typeof UserForgetPasswordDto>;

export const UserResetPasswordDto = z.object({
    newPassword: z.string().trim().min(8).regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
        "Password should have a min length of 8, contain both lower and uppercase, be alpha-numeric and contain at least 1 symbol"
    ),
    confirmNewPassword: z.string().trim().min(8).regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
        "Password should have a min length of 8, contain both lower and uppercase, be alpha-numeric and contain at least 1 symbol"
    ),
    token: z.string().trim().nonempty(),
})
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        error: "New password does not match",
    });
export type UserResetPasswordDtoType = z.infer<typeof UserResetPasswordDto>;

export const UserUploadAvatarDto = z.instanceof(FormData)
    .transform((fd) => Object.fromEntries(fd.entries()))
    .pipe(
        z.object({
            avatar: z.file()
                .max(10 * 1000 * 1000, { error: 'The image must not exceed 10MB' })
                .mime(['image/png', 'image/jpeg', 'image/webp']),
        }),
    );
export type UserUploadAvatarDtoType = z.infer<typeof UserUploadAvatarDto>;