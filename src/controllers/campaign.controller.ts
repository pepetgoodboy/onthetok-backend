import { Request, Response } from "express";
import { campaignService } from "../services/campaign.service";
import { createCampaignSchema, updateCampaignSchema } from "../validations/campaign.schema";
import { z } from "zod";

export const campaignController = {
    create: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

            const validatedData = createCampaignSchema.parse(req.body);
            const campaign = await campaignService.create(user.id, validatedData);

            res.status(201).json({
                success: true,
                message: "Campaign created successfully",
                data: campaign
            });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ success: false, message: "Validation Error", errors: error.issues });
                return;
            }
            res.status(400).json({ success: false, message: error.message });
        }
    },

    getAll: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

            const campaigns = await campaignService.getAll(user.id);
            res.json({
                success: true,
                data: campaigns
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getById: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

            const { id } = req.params;
            const campaign = await campaignService.getById(user.id, id);
            res.json({
                success: true,
                data: campaign
            });
        } catch (error: any) {
            res.status(404).json({ success: false, message: error.message });
        }
    },

    update: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

            const { id } = req.params;
            const validatedData = updateCampaignSchema.parse(req.body);
            const campaign = await campaignService.update(user.id, id, validatedData);

            res.json({
                success: true,
                message: "Campaign updated successfully",
                data: campaign
            });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ success: false, message: "Validation Error", errors: error.issues });
                return;
            }
            res.status(500).json({ success: false, message: error.message });
        }
    },

    delete: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

            const { id } = req.params;
            await campaignService.delete(user.id, id);

            res.json({
                success: true,
                message: "Campaign deleted successfully"
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
