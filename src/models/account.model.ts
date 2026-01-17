import mongoose, { Schema, Document } from 'mongoose';

export interface IAccount extends Document {
    userId: mongoose.Types.ObjectId;
    accountId: string;
    providerId: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: Date;
    refreshTokenExpiresAt?: Date;
    scope?: string;
    password?: string;
    idToken?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    accountId: { type: String, required: true },
    providerId: { type: String, required: true },
    accessToken: { type: String },
    refreshToken: { type: String },
    accessTokenExpiresAt: { type: Date },
    refreshTokenExpiresAt: { type: Date },
    scope: { type: String },
    password: { type: String },
    idToken: { type: String },
}, { timestamps: true });

export const Account = mongoose.models.Account || mongoose.model<IAccount>('Account', AccountSchema);
