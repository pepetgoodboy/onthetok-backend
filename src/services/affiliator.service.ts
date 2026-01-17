import { Affiliator, IAffiliator } from "../models/affiliator.model";
import { CreateAffiliatorInput, UpdateAffiliatorInput, BulkImportAffiliatorInput } from "../validations/affiliator.schema";
import mongoose from "mongoose";

export const affiliatorService = {
    create: async (userId: string, data: CreateAffiliatorInput) => {
        // Check duplication
        const existing = await Affiliator.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            tiktokUsername: data.tiktokUsername
        });

        if (existing) {
            throw new Error(`Affiliator with username ${data.tiktokUsername} already exists`);
        }

        const affiliator = await Affiliator.create({
            ...data,
            userId: new mongoose.Types.ObjectId(userId)
        });
        return affiliator;
    },

    getAll: async (userId: string, search?: string) => {
        const query: any = {
            userId: new mongoose.Types.ObjectId(userId)
        };

        if (search) {
            query.$or = [
                { tiktokUsername: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        const affiliators = await Affiliator.find(query).sort({ createdAt: -1 });
        return affiliators;
    },

    getById: async (userId: string, id: string) => {
        const affiliator = await Affiliator.findOne({
            _id: id,
            userId: new mongoose.Types.ObjectId(userId)
        });

        if (!affiliator) {
            throw new Error("Affiliator not found");
        }

        return affiliator;
    },

    update: async (userId: string, id: string, data: UpdateAffiliatorInput) => {
        const affiliator = await Affiliator.findOneAndUpdate(
            { _id: id, userId: new mongoose.Types.ObjectId(userId) },
            { $set: data },
            { new: true }
        );

        if (!affiliator) {
            throw new Error("Affiliator not found");
        }

        return affiliator;
    },

    delete: async (userId: string, id: string) => {
        const affiliator = await Affiliator.findOneAndDelete({
            _id: id,
            userId: new mongoose.Types.ObjectId(userId)
        });

        if (!affiliator) {
            throw new Error("Affiliator not found");
        }

        return affiliator;
    },

    bulkImport: async (userId: string, data: BulkImportAffiliatorInput) => {
        const operations = data.affiliators.map(aff => ({
            updateOne: {
                filter: {
                    userId: new mongoose.Types.ObjectId(userId),
                    tiktokUsername: aff.tiktokUsername
                },
                update: {
                    $set: { ...aff, userId: new mongoose.Types.ObjectId(userId) }
                },
                upsert: true
            }
        }));

        if (operations.length === 0) return { insertedCount: 0, modifiedCount: 0, upsertedCount: 0 };

        const result = await Affiliator.bulkWrite(operations);
        return result;
    }
};
