import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { Campaign } from "../models/campaign.model";
import { Affiliator } from "../models/affiliator.model";
import { SampleRequest } from "../models/sample-request.model";
import { BroadcastLog } from "../models/broadcast-log.model";

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
            sku: item.sku,
          });

          if (existing) {
            results.duplicates++;
            continue;
          }

          // Check for masked/censored data - skip if affiliator info is still masked
          const isMasked = (str: string) => str && str.includes("****");
          if (
            isMasked(item.affiliatorName) ||
            isMasked(item.affiliatorUsername) ||
            isMasked(item.affiliatorPhoneNumber)
          ) {
            console.log(
              `Skipping masked data for requestId: ${item.requestId}`,
            );
            results.errors++;
            continue;
          }

          // Logic: Link to Campaign & Affiliator
          let campaignId = null;
          let affiliatorId = null;

          // A. Find Campaign by SKU
          const campaign = await Campaign.findOne({
            userId: user.id,
            status: "active",
            skuArray: item.sku,
          });

          // B. Find Affiliator by Username (TikTok)
          const affiliator = await Affiliator.findOne({
            userId: user.id,
            tiktokUsername: item.affiliatorUsername,
          });

          // C. Validate: Both MUST exist together in BroadcastLog
          // Only link if we find a BroadcastLog entry with BOTH campaignId AND affiliatorId
          if (campaign && affiliator) {
            const broadcastLogMatch = await BroadcastLog.findOne({
              userId: user.id,
              campaignId: campaign._id,
              affiliatorId: affiliator._id,
            });

            if (broadcastLogMatch) {
              // Both found AND matched in BroadcastLog -> Link them
              campaignId = campaign._id;
              affiliatorId = affiliator._id;
            }
            // If no match in BroadcastLog, both stay null
          }
          // If only one is found (campaign or affiliator), both stay null

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
  // 3. Get Existing Order IDs (For Duplicate Check)
  getExistingIds: async (req: Request, res: Response) => {
    try {
      const user = res.locals.user;
      const existing = await SampleRequest.find({ userId: user.id })
        .select("requestId")
        .lean();
      const ids = existing.map((r: any) => r.requestId);
      res.json({ success: true, ids });
    } catch (error: any) {
      console.error("Get Existing IDs Error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
};
