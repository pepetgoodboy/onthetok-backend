import mongoose, { Schema, Document } from 'mongoose';

export interface IBroadcastMessage extends Document {
    userId: mongoose.Types.ObjectId;
    campaignId?: mongoose.Types.ObjectId;
    broadcastGroupId?: mongoose.Types.ObjectId;
    achievementStatusFilter?: string | null;
    message: string;
    messageType: 'recruitment' | 'follow_up' | 'custom';
    status: 'ready' | 'sending' | 'failed';
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const BroadcastMessageSchema = new Schema<IBroadcastMessage>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, // Singleton per user
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    broadcastGroupId: { type: Schema.Types.ObjectId, ref: 'BroadcastGroup' },
    achievementStatusFilter: { type: String, default: null },
    message: { type: String, default: '' },
    messageType: { type: String, enum: ['recruitment', 'follow_up', 'custom'], default: 'recruitment' },
    status: { type: String, enum: ['ready', 'sending', 'failed'], default: 'ready' },
    startedAt: { type: Date },
    completedAt: { type: Date },
}, { timestamps: true });

export const BroadcastMessage = mongoose.models.BroadcastMessage || mongoose.model<IBroadcastMessage>('BroadcastMessage', BroadcastMessageSchema);
