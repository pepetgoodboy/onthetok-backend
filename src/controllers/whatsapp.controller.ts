import { Request, Response } from "express";
import { whatsappService } from "../services/whatsapp.service";
import { User } from "../models/user.model";

export const createInstance = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.user.id;
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            res.status(400).json({ success: false, message: "Phone number is required" });
            return;
        }

        // Use userId as instance name
        const result = await whatsappService.createInstance(userId, phoneNumber);

        // Optionally update the user's phone number if they provided a new one for WA
        // await User.findByIdAndUpdate(userId, { phoneNumber });

        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: "Failed to create instance", error: error.message });
    }
};

export const connectInstance = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.user.id;
        const result = await whatsappService.connectInstance(userId);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: "Failed to get QR code", error: error.message });
    }
};

export const getInstanceStatus = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.user.id;
        const result = await whatsappService.getConnectionState(userId);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        // If 404 from service, it handles it, but just in case
        res.status(200).json({ success: true, data: { instance: { state: "close" } } });
    }
};

export const logoutInstance = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.user.id;
        const result = await whatsappService.logoutInstance(userId);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: "Failed to logout", error: error.message });
    }
};

// export const handleWebhookLogout = async (req: Request, res: Response) => {
//     try {
//         // Validate webhook secret
//         const authHeader = req.headers['authorization'];
//         const expectedToken = `Bearer ${process.env.WEBHOOK_SECRET}`;

//         if (!authHeader || authHeader !== expectedToken) {
//             console.warn('[Whatsapp Webhook] Unauthorized webhook attempt');
//             return res.status(401).send("Unauthorized");
//         }

//         const { event, instance } = req.body;

//         // console.log(`[Whatsapp Webhook] Event: ${event}, Instance: ${instance}`);

//         if (event === "LOGOUT_INSTANCE" || (event === "CONNECTION_UPDATE" && req.body.data?.state === "close")) {
//             // console.log(`[Whatsapp Webhook] Detected logout for instance ${instance}. Deleting...`);
//             // Delete the instance to save resources
//             try {
//                 await whatsappService.deleteInstance(instance);
//                 // console.log(`[Whatsapp Webhook] Instance ${instance} deleted successfully.`);
//             } catch (err: any) {
//                 console.error(`[Whatsapp Webhook] Failed to delete instance ${instance}:`, err.message);
//             }
//         }

//         res.status(200).send("OK");
//     } catch (error: any) {
//         console.error("Error handling webhook:", error);
//         res.status(500).send("Error");
//     }
// };

