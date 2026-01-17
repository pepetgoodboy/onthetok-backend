import { Request, Response } from "express";
import { broadcastService } from "../services/broadcast.service";
import { BroadcastMessage } from "../models/broadcast-message.model";

export const broadcastController = {
    generateMessage: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            const { campaignId, broadcastGroupId, messageType, achievementStatusFilter, prompt } = req.body;

            if (!campaignId) return res.status(400).json({ success: false, message: "Campaign ID is required" });

            const message = await broadcastService.generateMessage(
                user.id,
                campaignId,
                broadcastGroupId,
                messageType,
                achievementStatusFilter,
                prompt
            );

            res.json({ success: true, data: message });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    sendBroadcast: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            // Extract message and messageType to save them before sending
            const { campaignId, broadcastGroupId, achievementStatus, message, messageType } = req.body;

            await broadcastService.executeCampaign(
                campaignId,
                user.id,
                broadcastGroupId,
                achievementStatus,
                message,
                messageType
            );

            res.json({ success: true, message: "Broadcast process started" });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // New: Get Status
    getStatus: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            const status = await BroadcastMessage.findOne({ userId: user.id });
            res.json({ success: true, data: status });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // New: Get Logs with filter
    getLogs: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            const { campaignId, affiliatorId } = req.query;

            const logs = await broadcastService.getLogs(
                user.id,
                campaignId as string,
                affiliatorId as string
            );

            res.json({ success: true, data: logs });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
