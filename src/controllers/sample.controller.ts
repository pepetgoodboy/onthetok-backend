import { Request, Response } from "express";
import { SampleRequest } from "../models/sample-request.model";
import { Campaign } from "../models/campaign.model";
import { Affiliator } from "../models/affiliator.model";

export const sampleController = {
  // List Samples with Pagination & Filtering
  getSamples: async (req: Request, res: Response) => {
    try {
      const user = res.locals.user; // From auth middleware
      const { page = 1, limit = 10, search, campaignId, status } = req.query;

      const query: any = { userId: user.id };

      // Filter: Search (Product Name, SKU, Affiliator Name/Username, RequestID)
      if (search) {
        const searchRegex = { $regex: search, $options: "i" };
        query.$or = [
          { productName: searchRegex },
          { sku: searchRegex },
          { affiliatorName: searchRegex },
          { affiliatorUsername: searchRegex },
          { requestId: searchRegex },
        ];
      }

      // Filter: Campaign
      if (campaignId) {
        if (campaignId === "outside") {
          query.campaignId = null;
        } else if (campaignId === "inside") {
          query.campaignId = { $ne: null };
        } else {
          query.campaignId = campaignId;
        }
      }

      // Filter: Status
      if (status) {
        query.status = status;
      }

      // Pagination
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      const samples = await SampleRequest.find(query)
        .populate("campaignId", "name status") // Populate campaign info
        .populate("affiliatorId", "name tiktokUsername") // Populate affiliator info
        .sort({ requestDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(); // Use lean for performance

      const total = await SampleRequest.countDocuments(query);

      res.json({
        success: true,
        data: samples,
        meta: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      console.error("Get Samples Error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch samples" });
    }
  },

  // Delete Sample (Optional, maybe needed)
  deleteSample: async (req: Request, res: Response) => {
    try {
      const user = res.locals.user;
      const { id } = req.params;

      await SampleRequest.findOneAndDelete({ _id: id, userId: user.id });

      res.json({ success: true, message: "Sample deleted" });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: "Failed to delete sample" });
    }
  },
};
