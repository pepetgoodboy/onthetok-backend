import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { Campaign } from "../models/campaign.model";
import { Affiliator } from "../models/affiliator.model";
import { SampleRequest } from "../models/sample-request.model";

export const extensionController = {
  // 1. Verify License & Return Token
  verifyLicense: async (req: Request, res: Response) => {
    try {
      const { licenseKey } = req.body;

      if (!licenseKey) {
        return res
          .status(400)
          .json({ success: false, message: "License Key is required" });
      }

      // Find user by license key (assuming licenseKey is stored in User model as per Phase 1)
      const user = await User.findOne({ licenseKey });

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid License Key" });
      }

      // Check if subscription is active (Optional, based on your logic)
      // if (user.subscription.status !== 'active') ...

      // Generate JWT Token for Extension
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }, // Long expiry for extension convenience
      );

      res.json({
        success: true,
        token,
        user: {
          name: user.name,
          email: user.email,
          tier: user.subscription?.tier || "free",
        },
      });
    } catch (error: any) {
      console.error("License Verification Error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // 2. Sync Samples
  syncSamples: async (req: Request, res: Response) => {
    try {
      const user = res.locals.user; // From auth middleware
      const { samples } = req.body;

      if (!samples || !Array.isArray(samples)) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid data format. 'samples' array required.",
          });
      }

      const results = {
        synced: 0,
        duplicates: 0,
        errors: 0,
      };

      for (const item of samples) {
        try {
          // Check duplicate
          const existing = await SampleRequest.findOne({
            userId: user.id,
            requestId: item.requestId,
          });

          if (existing) {
            results.duplicates++;
            continue;
          }

          // Logic: Link to Campaign & Affiliator
          let campaignId = null;
          let affiliatorId = null;

          // A. Find Campaign by SKU
          // Search campaigns where skuArray contains this sku AND belongs to user AND is active
          const campaign = await Campaign.findOne({
            userId: user.id,
            status: "active",
            skuArray: item.sku, // Mongoose handles array contains query automatically for simple arrays
          });

          if (campaign) {
            campaignId = campaign._id;
          }

          // B. Find Affiliator by Username (TikTok)
          // Ensure case-insensitive match if needed, but assuming exact for now or standardize
          const affiliator = await Affiliator.findOne({
            userId: user.id,
            tiktokUsername: item.affiliatorUsername,
          });

          if (affiliator) {
            affiliatorId = affiliator._id;
          }

          // Strict Logic: Only link if BOTH are found?
          // User Request: "kosongkan campaignId jika sku tidak ada di dalam skuArray campaign dan usernameTiktok tidak ada dalam collectionAffiliator"
          // Implies: If either is missing, it might not be a "Campaign Sample".
          // However, it's usually better to link whatever we find.
          // Let's interpret the user rule: "Tandai sebagai diluar Campaign" usually means campaignId is null.

          // IF SKU match found -> It belongs to a campaign.
          // IF Affiliator match found -> We know who it is.

          // If SKU is NOT found in any campaign -> campaignId = null (Correct).

          await SampleRequest.create({
            userId: user.id,
            campaignId,
            affiliatorId,
            requestId: item.requestId,
            productName: item.productName,
            sku: item.sku,
            qty: item.qty || 1,
            affiliatorName: item.affiliatorName,
            affiliatorUsername: item.affiliatorUsername,
            affiliatorPhoneNumber: item.affiliatorPhoneNumber || "",
            status: item.status || "",
            courier: item.courier || "",
            trackingNumber: item.trackingNumber || "",
            requestDate: item.requestDate || new Date(),
          });

          results.synced++;
        } catch (err) {
          console.error("Error syncing item:", item, err);
          results.errors++;
        }
      }

      res.json({ success: true, results });
    } catch (error: any) {
      console.error("Sync Samples Error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
};
