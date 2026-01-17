import "dotenv/config";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { toNodeHandler } from "better-auth/node";
import { sendEmail } from "../services/email.service";
import { phoneNumberSchema } from "../validations/user.schema";

const client = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017/flexbit');
client.connect();
const db = client.db();
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

export const auth = betterAuth({
    baseURL: process.env.BASE_URL || "http://localhost:5000/api/auth",
    database: mongodbAdapter(db, {
        usePlural: true // Matches Mongoose default collection naming (users, sessions, accounts)
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Set to true if verification is strictly required before login
        autoSignIn: true, // Auto sign in after registration
        sendResetPassword: async ({ user, token }, request) => {
            await sendEmail({
                to: user.email,
                subject: "Reset Your Password - On The Tok",
                text: `Reset your password by clicking here: ${clientUrl}/reset-password?token=${token}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
                        <h2 style="color: #333333; text-align: center;">Reset Your Password</h2>
                        <p style="color: #666666; font-size: 16px; line-height: 1.5; text-align: center;">
                            You have requested to reset your password. Click the button below to proceed.
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${clientUrl}/reset-password?token=${token}" target="_blank" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                                Reset Password
                            </a>
                        </div>
                        <p style="color: #999999; font-size: 14px; text-align: center;">
                            If you didn't request this, please ignore this email. The link will expire shortly.
                        </p>
                        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
                        <p style="color: #bbbbbb; font-size: 12px; text-align: center;">
                            &copy; ${new Date().getFullYear()} On The Tok. All rights reserved.
                        </p>
                    </div>
                `
            });
        },
        onPasswordReset: async ({ user }, request) => {
            console.log("Password reset requested for user:", user.email);
        }
    },
    trustedOrigins: [clientUrl],
    secret: process.env.BETTER_AUTH_SECRET,
    user: {
        // Map extra fields if needed, but Mongoose adapter usually handles schema fields automatically if models are provided
        additionalFields: {
            phoneNumber: {
                type: "string",
                required: false
            },
            role: {
                type: "string",
                defaultValue: "user"
            },
            subscription: {
                type: "object" as any,
                defaultValue: {
                    tier: "starter",
                    status: "active",
                    startDate: new Date(),
                    expiryDate: null
                }
            },
            quota: {
                type: "object" as any,
                defaultValue: {
                    broadcastLimit: 0,
                    broadcastUsed: 0,
                    trackingLimit: 0,
                    trackingUsed: 0,
                    contentLimit: 0,
                    contentUsed: 0
                }
            },
            history: {
                type: "object" as any,
                defaultValue: {
                    broadcastUsed: 0,
                    trackingUsed: 0,
                    contentUsed: 0
                }
            },
            licenseKey: {
                type: "string",
                required: false
            }
        }
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    // Validate phoneNumber if provided
                    if (user.phoneNumber) {
                        const result = phoneNumberSchema.safeParse(user.phoneNumber);

                        if (!result.success) {
                            const errorMessage = result.error.issues[0]?.message || "Invalid phone number format";
                            throw new Error(errorMessage);
                        }
                    }
                    return { data: user };
                }
            }
        }
    },
    advanced: {
        defaultCookieAttributes: {
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            httpOnly: true,
            domain: process.env.NODE_ENV === "production" ? ".onthetok.id" : undefined
        }
    }
});

export const authHandler = toNodeHandler(auth);


