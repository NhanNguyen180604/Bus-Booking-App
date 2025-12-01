import z from "zod";

export const PaginationDto = z.object({
    page: z.int().gte(1, { error: "Page number must be >= 1" }).optional().default(1),
    perPage: z.int().gte(1, { error: "Per Page number must be >= 1" }).optional().default(1),
});

export const sortOptions = z.enum(["asc", "desc"]).optional();