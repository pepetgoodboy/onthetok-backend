import mongoose, { Schema, Document } from 'mongoose';

export interface IBroadcastGroup extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    affiliatorIds: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const BroadcastGroupSchema = new Schema<IBroadcastGroup>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    affiliatorIds: [{ type: Schema.Types.ObjectId, ref: 'Affiliator' }],
}, { timestamps: true });

export const BroadcastGroup = mongoose.models.BroadcastGroup || mongoose.model<IBroadcastGroup>('BroadcastGroup', BroadcastGroupSchema);
