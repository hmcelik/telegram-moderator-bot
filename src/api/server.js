import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { initializeDatabase } from '../common/services/database.js';
import logger from '../common/services/logger.js';
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import webAppRoutes from './routes/webapp.js';
import errorResponder from './utils/errorResponder.js';
import ApiError from './utils/apiError.js';

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://web.telegram.org"],
            scriptSrc: ["'self'", "https://web.telegram.org"],
            imgSrc: ["'self'", "data:", "https://web.telegram.org"],
            connectSrc: ["'self'", "https://api.telegram.org"],
            frameSrc: ["https://web.telegram.org"],
        },
    },
}));

// Enhanced CORS configuration for Telegram Mini Apps and external websites
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests from Telegram WebApp
        const allowedOrigins = [
            'https://web.telegram.org',
            'https://t.me',
            process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
            'http://localhost:8080', // For local development server
            // Add your production domains here
        ];
        
        // Allow requests with no origin (like mobile apps, curl requests, or file://)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Init-Data'],
    credentials: true,
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
});

app.use('/api/v1/auth', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Telegram Moderator Bot API',
            version: '1.0.0',
            description: 'API for Telegram Moderator Bot - supports Mini Apps and external integrations',
        },
        servers: [
            {
                url: process.env.API_BASE_URL || 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
                TelegramAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-Telegram-Init-Data',
                    description: 'Telegram WebApp initData for authentication',
                },
            },
        },
        security: [
            {
                BearerAuth: [],
            },
            {
                TelegramAuth: [],
            },
        ],
    },
    apis: ['./src/api/routes/*.js', './src/api/controllers/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Stricter rate limiting for auth endpoints
app.use('/api/v1/auth', authLimiter);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/webapp', webAppRoutes);

app.use((req, res, next) => {
    next(new ApiError(404, 'Not Found'));
});
app.use(errorResponder);

const startServer = async () => {
    try {
        await initializeDatabase();
        logger.info('Database initialized for API server.');
        const PORT = process.env.API_PORT || 3000;
        app.listen(PORT, () => {
            logger.info(`🚀 API Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start API server:', error);
        process.exit(1);
    }
};

// This check prevents the server from starting during tests
if (process.env.NODE_ENV !== 'test') {
    startServer();
}

// Export the app for supertest
export default app;