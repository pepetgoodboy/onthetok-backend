import { Request, Response, NextFunction } from "express";
import { auth } from "../config/auth";
import { fromNodeHeaders } from "better-auth/node";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    res.locals.user = session.user;
    res.locals.session = session.session;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (session.user.role !== "admin") {
      res
        .status(403)
        .json({ success: false, message: "Forbidden: Admin access only" });
      return;
    }

    res.locals.user = session.user;
    res.locals.session = session.session;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const requireExtensionAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    // Debug Log
    console.log("[ExtAuth] Header:", authHeader ? "Present" : "Missing");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ success: false, message: "Unauthorized: No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];

    // Import jwt here
    const jwt = require("jsonwebtoken");

    if (!process.env.JWT_SECRET) {
      console.error("[ExtAuth] CRITICAL: JWT_SECRET is not defined!");
      res
        .status(500)
        .json({
          success: false,
          message: "Server Error: Auth Configuration Missing",
        });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("[ExtAuth] Token verified for user:", (decoded as any).email);

    res.locals.user = decoded;
    next();
  } catch (error: any) {
    console.error("[ExtAuth] Verification Failed:", error.message);
    res
      .status(401)
      .json({ success: false, message: `Unauthorized: ${error.message}` });
  }
};
