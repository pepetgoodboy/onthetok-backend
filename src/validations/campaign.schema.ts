import { z } from "zod";

export const createCampaignSchema = z.object({
    name: z.string().min(3, "Campaign name must be at least 3 characters"),
    productName: z.string().min(1, "Product name is required"),
    skuArray: z.array(z.string()).min(1, "At least one SKU is required"),
    linkSample: z.string().url("Sample link must be a valid URL"),
    productQty: z.number().int().min(1, "Product quantity must be at least 1"),
    brief: z.string().min(10, "Brief must be at least 10 characters"),
    videoQty: z.number().int().min(1, "Video quantity must be at least 1"),
    joinMessage: z.string().min(1, "Join message is required").toUpperCase(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    status: z.enum(['active', 'inactive']).default('active'),
    autoMessages: z.object({
        welcomeMessage: z.string().optional(),
        sampleDeliveryMessage: z.string().optional(),
        friendlyReminderMessage: z.string().optional(),
        firmReminderMessage: z.string().optional(),
        emergencyReminderMessage: z.string().optional(),
    }).optional()
});

export const updateCampaignSchema = createCampaignSchema.partial();

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
