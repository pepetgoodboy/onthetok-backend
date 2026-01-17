import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.APP_EMAIL,
        pass: process.env.APP_PASSWORD,
    },
});

interface SendEmailParams {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export const sendEmail = async ({ to, subject, text, html }: SendEmailParams) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.APP_EMAIL,
            to,
            subject,
            text,
            html: html || text, // Fallback to text if html is not provided
        });
        return info;
    } catch (error) {
        throw error; // Let the caller handle/log it or we can just log it
    }
};
