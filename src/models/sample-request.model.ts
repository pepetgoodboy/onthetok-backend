import mongoose, { Schema, Document } from 'mongoose';

export interface ISampleRequest extends Document {
    userId: mongoose.Types.ObjectId;
    campaignId?: mongoose.Types.ObjectId;
    affiliatorId?: mongoose.Types.ObjectId;
    requestId: string;
    productName: string;
    sku: string;
    affiliatorName: string;
    affiliatorUsername: string; // Store username for matching
    status: string;
    requestDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

const SampleRequestSchema = new Schema<ISampleRequest>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' }, // Optional (if outside campaign)
    affiliatorId: { type: Schema.Types.ObjectId, ref: 'Affiliator' }, // Optional (if not registered)

    requestId: { type: String, required: true }, // Unique ID from TikTok
    productName: { type: String, required: true },
    sku: { type: String, required: true },

    affiliatorName: { type: String, required: true },
    affiliatorUsername: { type: String, required: true },

    status: { type: String, default: 'Pending' },
    requestDate: { type: Date, default: Date.now },

}, { timestamps: true });

// Compound index to prevent duplicate syncing for same user & request
SampleRequestSchema.index({ userId: 1, requestId: 1 }, { unique: true });
SampleRequestSchema.index({ campaignId: 1 });
SampleRequestSchema.index({ affiliatorId: 1 });

export const SampleRequest = mongoose.models.SampleRequest || mongoose.model<ISampleRequest>('SampleRequest', SampleRequestSchema);
