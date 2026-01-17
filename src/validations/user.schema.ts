import { z } from "zod";

/**
 * Phone number schema - must start with "62" (Indonesian format without + prefix)
 * Valid: 628123456789 (62 + 9-12 digits)
 * Invalid: +628123456789, 08123456789, 1234567890
 */
export const phoneNumberSchema = z
    .string()
    .min(10, { message: "Phone number must be at least 10 characters" })
    .max(15, { message: "Phone number must be at most 15 characters" })
    .regex(/^62\d{9,12}$/, {
        message: "Phone number must start with 62 (e.g. 628123456789)"
    });

/**
 * Register user schema - validates signup request body
 */
export const registerUserSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    phoneNumber: phoneNumberSchema.optional()
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;

/**
 * Create User Schema for Admin
 */
export const createUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phoneNumber: phoneNumberSchema,
    subscription: z.object({
        tier: z.enum(['starter', 'growth', 'scale']),
        expiryDate: z.string().or(z.date()).transform((val) => new Date(val))
    })
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
