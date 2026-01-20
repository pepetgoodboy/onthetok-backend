import mongoose, { Schema, Document } from "mongoose";

export const UserTier = {
  STARTER: "starter",
  GROWTH: "growth",
  SCALE: "scale",
} as const;

export type UserTierType = (typeof UserTier)[keyof typeof UserTier];

export interface IUser extends Document {
  name: string;
  email: string;
  emailVerified: boolean;
  phoneNumber?: string;
  image?: string;
  role: "user" | "admin";
  subscription: {
    tier: UserTierType;
    status: "active" | "expired" | "canceled";
    startDate: Date;
    expiryDate: Date | null;
  };
  quota: {
    broadcastLimit: number;
    broadcastUsed: number;
    remainingBroadcast: number;
    trackingLimit: number;
    trackingUsed: number;
    remainingTracking: number;
    contentLimit: number;
    contentUsed: number;
    remainingContent: number;
  };
  history: {
    broadcastUsed: number;
    trackingUsed: number;
    contentUsed: number;
  };
  licenseKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Boolean, default: false },
    phoneNumber: { type: String },
    image: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    // Subscription & Quota
    subscription: {
      tier: {
        type: String,
        enum: Object.values(UserTier),
        default: UserTier.STARTER,
      },
      status: {
        type: String,
        enum: ["active", "expired", "canceled"],
        default: "active",
      },
      startDate: { type: Date, default: Date.now },
      expiryDate: { type: Date, default: null },
    },

    quota: {
      broadcastLimit: { type: Number, default: 0 },
      broadcastUsed: { type: Number, default: 0 },
      remainingBroadcast: { type: Number, default: 0 },
      trackingLimit: { type: Number, default: 0 },
      trackingUsed: { type: Number, default: 0 },
      remainingTracking: { type: Number, default: 0 },
      contentLimit: { type: Number, default: 0 },
      contentUsed: { type: Number, default: 0 },
      remainingContent: { type: Number, default: 0 },
    },

    history: {
      broadcastUsed: { type: Number, default: 0 },
      trackingUsed: { type: Number, default: 0 },
      contentUsed: { type: Number, default: 0 },
    },

    licenseKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
);

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
