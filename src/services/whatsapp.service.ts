import axios, { AxiosInstance } from "axios";

// Evolution API Service
export class WhatsappService {
    private axios: AxiosInstance;
    private apiKey: string;

    constructor() {
        const baseURL = process.env.EVOLUTION_API_URL || "https://evo1.iqbalm.my.id";
        this.apiKey = process.env.EVOLUTION_API_KEY || "";

        if (!baseURL) {
            console.error("EVOLUTION_API_URL is not defined");
        }

        this.axios = axios.create({
            baseURL,
            headers: {
                "apikey": this.apiKey,
                "Content-Type": "application/json"
            }
        });
    }

    // Create Instance
    async createInstance(instanceName: string, number: string) {
        const createPayload = {
            instanceName: instanceName,
            token: instanceName,
            number: number,
            qrcode: false,
            integration: "WHATSAPP-BAILEYS",
            webhook: {
                url: process.env.WEBHOOK_URL || "https://n8npet.space/webhook/ott-webhook",
                byEvents: true,
                base64: false,
                headers: {
                    "Authorization": "Bearer " + process.env.WEBHOOK_SECRET,
                    "Content-Type": "application/json"
                },
                events: ["QRCODE_UPDATED", "MESSAGES_UPSERT", "CONNECTION_UPDATE"]
            }
        };

        try {
            const response = await this.axios.post(`/instance/create`, createPayload);
            return response.data;
        } catch (error: any) {
            // Check if instance already exists
            const errorMsg = error.response?.data?.error || error.response?.data?.message;
            if (errorMsg === "Instance already exists" || error.response?.status === 403) {
                // Check if it's connected or stale
                const state = await this.getConnectionState(instanceName);

                if (state?.instance?.state === 'open') {
                    // Already connected, return existing
                    return { instanceExists: true, status: 'connected' };
                } else {
                    // Not connected (stale or previous attempt). Delete and recreate to ensure new number is used.
                    console.log(`[Whatsapp] Deleting stale instance for ${instanceName} to recreate with new number.`);
                    await this.deleteInstance(instanceName);

                    // Tiny delay to ensure deletion propagation (optional but safe)
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Retry creation
                    const retryResponse = await this.axios.post(`/instance/create`, createPayload);
                    return retryResponse.data;
                }
            }
            console.error("Error creating instance:", error.response?.data || error.message);
            throw error;
        }
    }

    // Connect / Get QR
    async connectInstance(instanceName: string) {
        try {
            const response = await this.axios.get(`/instance/connect/${instanceName}`);
            return response.data; // Should contain base64 or code
        } catch (error: any) {
            console.error("Error connecting instance:", error.response?.data || error.message);
            throw error;
        }
    }

    // Get Connection Status
    async getConnectionState(instanceName: string) {
        try {
            const response = await this.axios.get(`/instance/connectionState/${instanceName}`);
            return response.data;
        } catch (error: any) {
            // 404 means instance likely doesn't exist
            if (error.response?.status === 404) {
                return { instance: { state: "close" } };
            }
            console.error("Error getting connection state:", error.response?.data || error.message);
            throw error;
        }
    }

    // Logout / Delete
    async logoutInstance(instanceName: string) {
        try {
            // Priority: DELETE instance completely
            const response = await this.axios.delete(`/instance/delete/${instanceName}`);
            return response.data;
        } catch (error: any) {
            console.error("Error deleting instance:", error.response?.data || error.message);
            throw error;
        }
    }

    // Explicit Delete (for webhook usage)
    async deleteInstance(instanceName: string) {
        return this.logoutInstance(instanceName);
    }

    // Start Typing or Send Presence
    async sendPresence(instanceName: string, number: string, delay: number) {
        try {
            const response = await this.axios.post(`/chat/sendPresence/${instanceName}`, {
                number: number,
                delay: delay,
                presence: "composing"
            });
            return response.data;
        } catch (error: any) {
            console.error("Error starting typing:", error.response?.data || error.message);
            throw error;
        }
    }

    // Send Text Message
    async sendTextMessage(instanceName: string, number: string, text: string) {
        try {
            const response = await this.axios.post(`/message/sendText/${instanceName}`, {
                number: number,
                text: text,
                delay: 1200,
                linkPreview: true
            });
            return response.data;
        } catch (error: any) {
            console.error("Error sending message:", error.response?.data || error.message);
            // Don't throw, just log. We don't want to break the booking flow if WA fails.
            return null;
        }
    }
}

export const whatsappService = new WhatsappService();
