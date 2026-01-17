import { auth } from "../config/auth";
import { User, IUser, UserTier } from "../models/user.model";
import { BroadcastMessage } from "../models/broadcast-message.model";
import crypto from 'crypto';
import mongoose from "mongoose";

export const userService = {
    /**
     * Create a new user (Admin only)
     * Auto generates password if not provided
     * Auto generates license key
     * Initializes BroadcastMessage singleton
     */
    createUser: async (data: {
        name: string;
        email: string;
        phoneNumber: string;
        subscription: {
            tier: string;
            expiryDate: Date;
        }
    }) => {
        // 1. Generate Password & License Key
        const password = crypto.randomBytes(8).toString('hex'); // 16 chars random password
        const licenseKey = crypto.randomUUID();

        // 2. Determine Quota based on Tier
        let quota = {
            broadcastLimit: 0,
            broadcastUsed: 0,
            trackingLimit: 0,
            trackingUsed: 0,
            contentLimit: 0,
            contentUsed: 0
        };

        const tier = data.subscription.tier;
        switch (tier) {
            case UserTier.STARTER:
                quota.broadcastLimit = 10000;
                quota.trackingLimit = 350;
                quota.contentLimit = 2500;
                break;
            case UserTier.GROWTH:
                quota.broadcastLimit = 30000;
                quota.trackingLimit = 750;
                quota.contentLimit = 5000;
                break;
            case UserTier.SCALE:
                quota.broadcastLimit = 100000;
                quota.trackingLimit = 2500;
                quota.contentLimit = 15000;
                break;
        }

        // 3. Create User via Better Auth
        // Note: auth.api.signUpEmail returns response/error explicitly.
        // In Node context without headers, it essentially calls the internal logic.
        const response = await auth.api.signUpEmail({
            body: {
                email: data.email,
                password: password,
                name: data.name,
                phoneNumber: data.phoneNumber,
                licenseKey: licenseKey,
                subscription: {
                    tier: tier,
                    status: 'active',
                    startDate: new Date(),
                    expiryDate: data.subscription.expiryDate
                },
                quota: quota,
                history: {
                    broadcastUsed: 0,
                    trackingUsed: 0,
                    contentUsed: 0
                }
            }
        });

        if (!response.user) {
            throw new Error("Failed to create user via Auth System");
        }

        const user = response.user;

        // 4. Create Singleton BroadcastMessage
        await BroadcastMessage.create({
            userId: new mongoose.Types.ObjectId(user.id),
            message: "",
            status: 'ready'
        });

        return {
            user,
            rawPassword: password,
            licenseKey
        };
    },

    /**
     * Generate a new License Key for a user
     */
    generateLicenseKey: async (userId: string) => {
        const newKey = crypto.randomUUID();

        await User.findByIdAndUpdate(userId, {
            licenseKey: newKey
        });

        return newKey;
    },

    /**
     * Get all users
     */
    getAllUsers: async () => {
        const users = await User.find().sort({ createdAt: -1 });
        return users;
    },

    /**
     * Update user details
     */
    updateUser: async (id: string, data: Partial<IUser>) => {
        // If updating tier, should we update quota? 
        // For now simple update. Quota adjustment logic usually goes here if tier changes.
        // Assuming Admin handles quota manually or logic is simple.

        const updatedUser = await User.findByIdAndUpdate(id, data, { new: true });
        return updatedUser;
    },

    /**
     * Get User Profile (Self)
     */
    getUserProfile: async (userId: string) => {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");
        return user;
    },

    /**
     * Update User Profile (Self)
     */
    updateProfile: async (userId: string, data: { name?: string; phoneNumber?: string }) => {
        const updatedUser = await User.findByIdAndUpdate(userId, {
            $set: data
        }, { new: true });
        return updatedUser;
    },

    /**
     * Get Subscription Data
     */
    getSubscription: async (userId: string) => {
        const user = await User.findById(userId).select('subscription quota history');
        if (!user) throw new Error("User not found");
        return {
            subscription: user.subscription,
            quota: user.quota,
            history: user.history
        };
    },

    /**
     * Delete user and related data
     */
    deleteUser: async (id: string) => {
        // 1. Delete User
        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            throw new Error("User not found");
        }

        // 2. Delete BroadcastMessage Singleton
        await BroadcastMessage.findOneAndDelete({ userId: new mongoose.Types.ObjectId(id) });

        return deletedUser;
    }
};
