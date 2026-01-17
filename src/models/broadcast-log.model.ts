import mongoose, { Schema, Document } from 'mongoose';

export interface IBroadcastLog extends Document {
    userId: mongoose.Types.ObjectId;
    campaignId: mongoose.Types.ObjectId;
    affiliatorId: mongoose.Types.ObjectId;
    isJoin: boolean;
    joinConfirmationDate?: Date;
    contentProgress: number;
    achievementStatus: 'no_response_yet' | 'not_started' | 'in_progress' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
}

const BroadcastLogSchema = new Schema<IBroadcastLog>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    affiliatorId: { type: Schema.Types.ObjectId, ref: 'Affiliator', required: true },
    isJoin: { type: Boolean, default: false },
    joinConfirmationDate: { type: Date },
    contentProgress: { type: Number, default: 0 }, // 0 - 100 percentage or step count
    achievementStatus: {
        type: String,
        enum: ['no_response_yet', 'not_started', 'in_progress', 'completed', 'failed'],
        default: 'no_response_yet'
    },
}, { timestamps: true });

// Index for faster queries
BroadcastLogSchema.index({ campaignId: 1, affiliatorId: 1 }, { unique: true }); // One log per affiliator per campaign
BroadcastLogSchema.index({ userId: 1 });

export const BroadcastLog = mongoose.models.BroadcastLog || mongoose.model<IBroadcastLog>('BroadcastLog', BroadcastLogSchema);
