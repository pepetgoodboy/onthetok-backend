import { Request, Response } from "express";
import { affiliatorService } from "../services/affiliator.service";
import { createAffiliatorSchema, updateAffiliatorSchema, bulkImportAffiliatorSchema } from "../validations/affiliator.schema";
import { z } from "zod";

export const affiliatorController = {
    create: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

            const validatedData = createAffiliatorSchema.parse(req.body);
            const affiliator = await affiliatorService.create(user.id, validatedData);

            res.status(201).json({
                success: true,
                message: "Affiliator added successfully",
                data: affiliator
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

            const { search } = req.query;
            const affiliators = await affiliatorService.getAll(user.id, search as string);

            res.json({
                success: true,
                data: affiliators
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
            const affiliator = await affiliatorService.getById(user.id, id);

            res.json({
                success: true,
                data: affiliator
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
            const validatedData = updateAffiliatorSchema.parse(req.body);
            const affiliator = await affiliatorService.update(user.id, id, validatedData);

            res.json({
                success: true,
                message: "Affiliator updated successfully",
                data: affiliator
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
            await affiliatorService.delete(user.id, id);

            res.json({
                success: true,
                message: "Affiliator deleted successfully"
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    bulkImport: async (req: Request, res: Response) => {
        try {
            const user = res.locals.user;
            if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

            // Expecting body: { affiliators: [...] }
            const validatedData = bulkImportAffiliatorSchema.parse(req.body);
            const result = await affiliatorService.bulkImport(user.id, validatedData);

            res.json({
                success: true,
                message: "Bulk import completed",
                data: result
            });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ success: false, message: "Validation Error", errors: error.issues });
                return;
            }
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
