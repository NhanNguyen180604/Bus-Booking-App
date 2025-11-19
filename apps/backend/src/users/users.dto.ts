import z from "zod";

// local login
export const UserLoginDto = z.object({
    email: z.email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    rememberMe: z.string().transform((v) => v === 'true'),
});
export type UserLoginDtoType = z.infer<typeof UserLoginDto>;

// local register
export const UserRegisterDto = z.object({
    email: z.email(),
    // TODO: phone validation?
    phone: z.string().min(8),
    password: z.string().min(8).regex(
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
    rememberMe: z.string().transform((v) => v === 'true'),
})
    .refine((data) => data.password === data.confirmPassword, {
        message: "Password does not match",
        path: ["confirmPassword"],
    });
export type UserRegisterDtoType = z.infer<typeof UserRegisterDto>;