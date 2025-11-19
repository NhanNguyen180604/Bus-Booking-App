import z from "zod";

export const UserLoginDto = z.object({
    email: z.email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    rememberMe: z.string().transform((v) => v === 'true'),
});
export type UserLoginDtoType = z.infer<typeof UserLoginDto>;