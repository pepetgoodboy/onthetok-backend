import { Request, Response } from "express";
import { BroadcastGroup } from "../models/broadcast-group.model";
import { z } from "zod";

const createGroupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    affiliatorIds: z.array(z.string()).default([])
});

const updateGroupSchema = z.object({
    name: z.string().min(1).optional(),
    affiliatorIds: z.array(z.string()).optional()
});

export const broadcastGroupController = {
    getAll: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            const groups = await BroadcastGroup.find({ userId: user.id }).sort({ createdAt: -1 });
            res.json({ success: true, data: groups });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    create: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            const validatedData = createGroupSchema.parse(req.body);

            const group = await BroadcastGroup.create({
                userId: user.id,
                ...validatedData
            });

            res.status(201).json({ success: true, data: group });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, message: "Validation error", errors: error.issues });
            }
            res.status(500).json({ success: false, message: error.message });
        }
    },

    update: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            const { id } = req.params;
            const validatedData = updateGroupSchema.parse(req.body);

            const group = await BroadcastGroup.findOneAndUpdate(
                { _id: id, userId: user.id },
                { $set: validatedData },
                { new: true }
            );

            if (!group) return res.status(404).json({ success: false, message: "Group not found" });

            res.json({ success: true, data: group });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    delete: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            const { id } = req.params;

            const group = await BroadcastGroup.findOneAndDelete({ _id: id, userId: user.id });
            if (!group) return res.status(404).json({ success: false, message: "Group not found" });

            res.json({ success: true, message: "Group deleted" });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
