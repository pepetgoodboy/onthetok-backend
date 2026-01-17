import mongoose, { Schema, Document } from "mongoose";

export interface ICampaign extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    productName: string;
    skuArray: string[];
    linkSample: string;
    productQty: number;
    brief: string;
    videoQty: number;
    joinMessage: string;
    startDate: Date;
    endDate: Date;
    status: 'active' | 'inactive';
    autoMessages: {
        welcomeMessage: string;
        sampleDeliveryMessage: string;
        friendlyReminderMessage: string;
        firmReminderMessage: string;
        emergencyReminderMessage: string;
    };
    stats: {
        affiliatorCount: number;
        sampleSentCount: number;
        videoCount: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const CampaignSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    productName: { type: String, required: true },
    skuArray: { type: [String], index: true, default: [] },
    linkSample: { type: String, required: true },
    productQty: { type: Number, required: true, min: 1 },
    brief: { type: String, required: true },
    videoQty: { type: Number, required: true, min: 1 },
    joinMessage: { type: String, required: true, uppercase: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    autoMessages: {
        welcomeMessage: { type: String, default: "" },
        sampleDeliveryMessage: { type: String, default: "" },
        friendlyReminderMessage: { type: String, default: "" },
        firmReminderMessage: { type: String, default: "" },
        emergencyReminderMessage: { type: String, default: "" }
    },
    stats: {
        affiliatorCount: { type: Number, default: 0 },
        sampleSentCount: { type: Number, default: 0 },
        videoCount: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Index for getting active campaigns for a user
CampaignSchema.index({ userId: 1, status: 1 });

export const Campaign = mongoose.model<ICampaign>("Campaign", CampaignSchema);
