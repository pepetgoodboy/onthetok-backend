import mongoose, { Schema, Document } from "mongoose";

export interface IAffiliator extends Document {
    userId: mongoose.Types.ObjectId;
    tiktokUsername: string;
    name: string;
    phoneNumber: string;
    qualityScore: number;
    totalCampaigns: number;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

const AffiliatorSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tiktokUsername: { type: String, required: true, trim: true },
    name: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    qualityScore: { type: Number, default: 0 },
    totalCampaigns: { type: Number, default: 0 },
    notes: { type: String, default: "" }
}, {
    timestamps: true
});

// Unique index for (userId + tiktokUsername) to prevent duplicate affiliators for same user
AffiliatorSchema.index({ userId: 1, tiktokUsername: 1 }, { unique: true });

export const Affiliator = mongoose.model<IAffiliator>("Affiliator", AffiliatorSchema);
