import axios from "axios";
import { Campaign } from "../models/campaign.model";
import { User } from "../models/user.model";
import { Affiliator } from "../models/affiliator.model";
import { BroadcastMessage } from "../models/broadcast-message.model";
import { BroadcastLog } from "../models/broadcast-log.model";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export const broadcastService = {
    // This function triggers the n8n workflow which handles the loop and message generation
    executeCampaign: async (
        campaignId: string,
        userId: string,
        broadcastGroupId: string = "default",
        achievementStatus: string = "all",
        message?: string,
        messageType: string = "recruitment"
    ) => {
        const campaign = await Campaign.findById(campaignId);

        if (!campaign) throw new Error("Campaign not found");
        if (campaign.status === 'inactive') throw new Error("Campaign is inactive");

        const userName = await User.findById(userId).select("name");
        const broadcastMessageId = await BroadcastMessage.findOne({ userId }).select("_id");

        // UPSERT the message to ensure it's up to date even if manually typed
        // This fixes the issue where custom messages w/o AI gen weren't saved
        const broadcastMessage = await BroadcastMessage.findOneAndUpdate(
            { userId },
            {
                userId,
                userName,
                campaignId,
                broadcastGroupId,
                achievementStatusFilter: achievementStatus, // Map achievementStatus to filter
                message: message || "", // Save the message passed from frontend
                messageType,
                status: 'sending', // Mark as sending
                startedAt: new Date()
            },
            { upsert: true, new: true }
        );

        console.log(`[Broadcast] Triggering n8n for campaign: ${campaign.name} (ID: ${campaignId})`);

        const webhookUrl = "https://n8npet.space/webhook/ott-broadcast";

        // Payload as requested: userId, campaignId, broadcastGroupId, achievementStatus, message
        // message here is the template or core message from campaign

        const payload = {
            userId,
            userName,
            campaignId,
            campaignName: campaign.name,
            broadcastGroupId,
            broadcastMessageId,
            achievementStatus,
            message: broadcastMessage.message, // Use the upserted message
            timestamp: new Date().toISOString()
        };

        try {
            await axios.post(webhookUrl, payload);
            console.log(`[Broadcast] Successfully triggered n8n for Campaign ${campaignId}`);
        } catch (error: any) {
            console.error(`[Broadcast] n8n triggering error:`, error.message);
            // Revert status if failed? Or let user retry.
            // await BroadcastMessage.updateOne({ userId }, { status: 'failed' });
            throw new Error(`Failed to trigger broadcast: ${error.message}`);
        }
    },

    // AI Message Generator
    generateMessage: async (
        userId: string,
        campaignId: string,
        broadcastGroupId: string,
        messageType: string,
        achievementStatusFilter: string | null = null,
        prompt?: string
    ) => {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not configured on the server.");
        }

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) throw new Error("Campaign not found");

        const { name, productName, linkSample, brief, joinMessage, startDate, endDate } = campaign;

        const formattedStartDate = new Date(startDate).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
        const formattedEndDate = new Date(endDate).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });

        let systemPrompt = "";

        if (messageType === 'custom') {
            // Rule 2: Custom Message
            if (!prompt) throw new Error("Prompt is required for custom message");

            systemPrompt = `Anda adalah seorang ahli copywriting profesional untuk kampanye influencer di WhatsApp. Tugas Anda adalah mengubah ${prompt} menjadi **satu buah pesan broadcast WhatsApp** yang ringkas sesuai dengan data kampanye berikut:
            
            Nama Kampanye: ${name}
            Produk: ${productName}
            Brief: ${brief}
            Tanggal Mulai: ${formattedStartDate}
            Tanggal Selesai: ${formattedEndDate}
            
            ---

            **FORMAT OUTPUT WAJIB:**
            Anda HARUS menghasilkan output berupa **satu string teks tunggal** saja. JANGAN membuat format JSON, array, atau nomor urut. Output Anda harus langsung berupa teks pesan WhatsApp yang sudah jadi.`;
        } else {
            // Rule 1: Recruitment (Default Campaign Template)
            // User provided prompt logic
            systemPrompt = `Anda adalah seorang ahli copywriting profesional untuk kampanye influencer di WhatsApp. Tugas Anda adalah mengubah sebuah **brief kampanye dalam format JSON** menjadi **satu buah pesan broadcast WhatsApp** yang ringkas, persuasif, dan siap kirim untuk mengundang kreator/afiliasi.

Tujuan utama pesan ini adalah untuk membuat para kreator tertarik bergabung dan memahami tugas mereka dengan jelas.

**PROSES BERPIKIR WAJIB ANDA:**
1.  **Analisis JSON:** Baca dan pahami setiap field dari data JSON yang masuk.
2.  **Ekstrak Informasi Kunci:** Ambil data spesifik dari field berikut untuk dirangkai menjadi pesan:
    *   "code": "${name}".
    *   "product": "${productName}".
    *   "deliverables_brief": "${brief} (Menjadi daftar tugas yang jelas untuk kreator)."
    *   "content_idea_brief": "${brief} (Sebagai saran atau inspirasi konten)."
    *   "start_date": "${formattedStartDate} (Tanggal Mulai Kampanye).".
    *   "end_date": "${formattedEndDate} (Tanggal Selesai Kampanye).".
    *   "link_product": "${linkSample}"
3.  **Tulis Pesan Terbaik:** Susun informasi tersebut menjadi **satu narasi pesan WhatsApp terbaik** yang mengalir, menarik, dan mudah dibaca di ponsel.

---

**ATURAN KONTEN WAJIB:**

1.  **Sapaan & Personalisasi:** Mulailah pesan dengan sapaan yang ramah dan sertakan placeholder {name}. Contoh: "Halo Kak {name}!", "Hai {name}, ada proyek seru nih!".
2.  **Struktur Pesan:** Gunakan alur yang logis:
    *   **Pembuka:** Sapaan dan perkenalan kampanye (WAJIB gunakan "${name}" dan "${productName}").
    *   **Periode:** Sebutkan "start_date" hingga "end_date".
    *   **Tugas Kreator (Deliverables):** Jelaskan "deliverables_brief" dalam bentuk daftar poin yang jelas.
    *   **Inspirasi Konten:** Berikan "content_idea_brief" sebagai ide segar.
    *   **Link Product:** Sebutkan "link_product" sebagai tautan tempat kreator bisa mengajukan sample produk. Jika "link_product" lebih dari 1 maka PISAHKAN DENGAN BARIS BARU agar mudah dibaca. 
    *   **Call to Action (CTA):** Ajak kreator untuk membalas pesan dengan format spesifik menggunakan nilai dari field code sebagai kata kunci. Jelaskan bahwa setelah membalas pesan, mereka bisa langsung mengajukan sample produk melalui link product yang sudah disediakan.Pastikan CTA ditulis dengan nada antusias dan mudah dipahami.

Contoh format CTA:

"Balas pesan ini dengan: ${joinMessage} lalu ajukan sample-nya di sini 👇
🔗 ${linkSample}"
3.  **Formatting WhatsApp:** Manfaatkan format *teks tebal* untuk menyorot nama kampanye, produk, dan CTA. Gunakan emoji 💡✨📹🎁 untuk membuat pesan lebih hidup.

---

**FORMAT OUTPUT WAJIB:**
Anda HARUS menghasilkan output berupa **satu string teks tunggal** saja. JANGAN membuat format JSON, array, atau nomor urut. Output Anda harus langsung berupa teks pesan WhatsApp yang sudah jadi.
JANGAN GANTI BAGIAN ${joinMessage}`;
        }

        // Generate content using Gemini
        const result = await model.generateContent(systemPrompt);
        const finalMessage = result.response.text();

        // Rule 3: Update collection broadcastmessages
        await BroadcastMessage.findOneAndUpdate(
            { userId },
            {
                userId,
                campaignId,
                messageType,
                broadcastGroupId,
                achievementStatusFilter,
                message: finalMessage,
                status: 'ready'
            },
            { upsert: true, new: true }
        );

        return finalMessage;
    },

    // Get Logs
    getLogs: async (userId: string, campaignId?: string, affiliatorId?: string) => {
        const query: any = { userId };

        if (campaignId) query.campaignId = campaignId;
        if (affiliatorId) query.affiliatorId = affiliatorId;

        return await BroadcastLog.find(query)
            .sort({ updatedAt: -1 })
            .populate("campaignId", "name") // Populate Campaign Name
            .populate("affiliatorId", "name") // Populate Affiliator Name
            .lean();
    }
};