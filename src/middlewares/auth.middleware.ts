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
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ success: false, message: "Unauthorized: No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];

    // Import jwt here to avoid top-level dependency if not needed elsewhere, or ensure it's imported at top
    const jwt = require("jsonwebtoken");

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    if (!decoded) {
      res
        .status(401)
        .json({ success: false, message: "Unauthorized: Invalid token" });
      return;
    }

    res.locals.user = decoded; // The payload usually contains user info
    next();
  } catch (error) {
    console.error("Extension Auth Error:", error);
    res
      .status(401)
      .json({ success: false, message: "Unauthorized: Invalid token" });
  }
};
