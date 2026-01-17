import { z } from "zod";

export const createAffiliatorSchema = z.object({
    tiktokUsername: z.string().min(1, "TikTok username is required"),
    name: z.string().min(1, "Name is required"),
    phoneNumber: z.string()
        .regex(/^62\d{9,12}$/, "Phone number must start with 62 and be 10-13 digits long"),
    notes: z.string().optional()
});

export const updateAffiliatorSchema = createAffiliatorSchema.partial();

export const bulkImportAffiliatorSchema = z.object({
    affiliators: z.array(createAffiliatorSchema)
});

export type CreateAffiliatorInput = z.infer<typeof createAffiliatorSchema>;
export type UpdateAffiliatorInput = z.infer<typeof updateAffiliatorSchema>;
export type BulkImportAffiliatorInput = z.infer<typeof bulkImportAffiliatorSchema>;
