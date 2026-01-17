import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import connectDB from './config/db';
import { authHandler } from './config/auth';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ⬇️ WAJIB, karena pakai nginx reverse proxy
app.set("trust proxy", 1);

// Connect Database then initialize scheduler
connectDB();

// Security Middleware
app.use(helmet());
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Performance Middleware
app.use(compression());

// Middleware
app.use(cors({
    origin: `${process.env.CLIENT_URL}`, // Frontend
    credentials: true
}));
app.use(express.json());

// Health Check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'On The Tok API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});


// Routes
// Strict Rate Limiter for Auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs for auth routes
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many login attempts, please try again later."
});

import adminRoutes from './routes/admin.routes';

app.all("/api/auth/*path", authLimiter, authHandler);
app.use("/api/admin", adminRoutes);

// Phase 2 Routes
import campaignRoutes from './routes/campaign.routes';
import affiliatorRoutes from './routes/affiliator.routes';

app.use("/api/campaigns", campaignRoutes);
app.use("/api/affiliators", affiliatorRoutes);

// Phase 3 Routes
import broadcastGroupRoutes from './routes/broadcast-group.routes';
import broadcastRoutes from './routes/broadcast.routes';

app.use("/api/broadcast/groups", broadcastGroupRoutes);
app.use("/api/broadcast", broadcastRoutes);

// Phase 4 Routes
import extensionRoutes from './routes/extension.routes';
import sampleRoutes from './routes/sample.routes';

app.use("/api/extension", extensionRoutes);
app.use("/api/samples", sampleRoutes);

// Settings Routes
import settingsRoutes from './routes/settings.routes';
app.use("/api/settings", settingsRoutes);

app.listen(PORT, () => {
    console.log(`Server running on Port ${PORT}`);
});
