import { Campaign, ICampaign } from "../models/campaign.model";
import { CreateCampaignInput, UpdateCampaignInput } from "../validations/campaign.schema";
import mongoose from "mongoose";

export const campaignService = {
    create: async (userId: string, data: CreateCampaignInput) => {
        const campaign = await Campaign.create({
            ...data,
            userId: new mongoose.Types.ObjectId(userId)
        });
        return campaign;
    },

    getAll: async (userId: string) => {
        const campaigns = await Campaign.find({
            userId: new mongoose.Types.ObjectId(userId)
        }).sort({ createdAt: -1 });
        return campaigns;
    },

    getById: async (userId: string, id: string) => {
        const campaign = await Campaign.findOne({
            _id: id,
            userId: new mongoose.Types.ObjectId(userId)
        });

        if (!campaign) {
            throw new Error("Campaign not found");
        }

        return campaign;
    },

    update: async (userId: string, id: string, data: UpdateCampaignInput) => {
        const campaign = await Campaign.findOneAndUpdate(
            { _id: id, userId: new mongoose.Types.ObjectId(userId) },
            { $set: data },
            { new: true }
        );

        if (!campaign) {
            throw new Error("Campaign not found");
        }

        return campaign;
    },

    delete: async (userId: string, id: string) => {
        const campaign = await Campaign.findOneAndDelete({
            _id: id,
            userId: new mongoose.Types.ObjectId(userId)
        });

        if (!campaign) {
            throw new Error("Campaign not found");
        }

        // TODO: Handle cascading delete (or check usages)
        // For now, simple delete.
        return campaign;
    }
};
