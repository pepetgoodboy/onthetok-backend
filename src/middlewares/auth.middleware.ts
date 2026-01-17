import { Request, Response, NextFunction } from "express";
import { auth } from "../config/auth";
import { fromNodeHeaders } from "better-auth/node";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
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

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        });

        if (!session) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        if (session.user.role !== 'admin') {
            res.status(403).json({ success: false, message: "Forbidden: Admin access only" });
            return;
        }

        res.locals.user = session.user;
        res.locals.session = session.session;
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
