import mongoose, { Schema, Document } from 'mongoose';

export interface IVerification extends Document {
    identifier: string;
    value: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const VerificationSchema = new Schema<IVerification>({
    identifier: { type: String, required: true },
    value: { type: String, required: true },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });

export const Verification = mongoose.models.Verification || mongoose.model<IVerification>('Verification', VerificationSchema);
