import { Request, Response } from "express";
import { userService } from "../services/user.service";
import { createUserSchema } from "../validations/user.schema";
import { z } from "zod";

export const userController = {
    /**
     * Create User (Admin)
     */
    createUser: async (req: Request, res: Response) => {
        try {
            // Validate input
            const validatedData = createUserSchema.parse(req.body);

            // Call service
            const result = await userService.createUser(validatedData);

            res.status(201).json({
                success: true,
                message: "User created successfully",
                data: result
            });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ success: false, message: "Validation Error", errors: error.issues });
                return;
            }
            res.status(400).json({ success: false, message: error.message || "Failed to create user" });
        }
    },

    /**
     * Get All Users (Admin)
     */
    getUsers: async (req: Request, res: Response) => {
        try {
            const users = await userService.getAllUsers();
            res.status(200).json({
                success: true,
                data: users
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Update User (Admin)
     */
    updateUser: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            // Basic validation for now, could add schema if needed
            const result = await userService.updateUser(id, req.body);
            res.json({
                success: true,
                message: "User updated successfully",
                data: result
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Generate License Key
     */
    generateLicense: async (req: Request, res: Response) => {
        try {
            const { userId } = req.body;
            if (!userId) {
                res.status(400).json({ success: false, message: "UserId is required" });
                return;
            }

            const key = await userService.generateLicenseKey(userId);
            res.status(200).json({
                success: true,
                message: "License Key generated",
                data: { licenseKey: key }
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Delete User (Admin)
     */
    deleteUser: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await userService.deleteUser(id);
            res.status(200).json({
                success: true,
                message: "User deleted successfully"
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Get Profile (Self)
     */
    getProfile: async (req: Request, res: Response) => {
        try {
            const userId = res.locals.user.id;
            const user = await userService.getUserProfile(userId);
            res.status(200).json({ success: true, data: user });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Update Profile (Self)
     */
    updateProfile: async (req: Request, res: Response) => {
        try {
            const userId = res.locals.user.id;
            // Basic validation
            const { name, phoneNumber } = req.body;

            const result = await userService.updateProfile(userId, { name, phoneNumber });
            res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: result
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Get Subscription (Self)
     */
    getSubscription: async (req: Request, res: Response) => {
        try {
            const userId = res.locals.user.id;
            const data = await userService.getSubscription(userId);
            res.status(200).json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Change Password (Self)
     * Note: Typically handled by Auth Provider, but if we need a backend wrapper:
     */
    changePassword: async (req: Request, res: Response) => {
        try {
            const userId = res.locals.user.id;
            const { currentPassword, newPassword } = req.body;

            if (!newPassword || newPassword.length < 8) {
                res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
                return;
            }

            // Use Better Auth API to change password
            // Assuming 'auth' is imported
            const { auth } = require("../config/auth");

            try {
                await auth.api.changePassword({
                    body: {
                        currentPassword,
                        newPassword,
                    },
                    headers: req.headers // Pass headers for context if needed
                });

                res.status(200).json({ success: true, message: "Password updated successfully" });
            } catch (authError: any) {
                // Better Auth throws error if current password mismatch
                res.status(400).json({ success: false, message: authError.message || "Failed to update password" });
            }

        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
