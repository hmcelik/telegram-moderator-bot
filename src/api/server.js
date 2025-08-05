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
import nlpRoutes from './routes/nlp.js';
import errorResponder from './utils/errorResponder.js';
import ApiError from './utils/apiError.js';
import { ERROR_TYPES } from './utils/errorTypes.js';
import { maintenanceCheck } from './utils/errorHelpers.js';

const app = express();

// Trust proxy settings for deployment behind reverse proxies (Vercel, etc.)
// This is needed for proper rate limiting and IP detection
const trustProxy = process.env.TRUST_PROXY === 'true' || 
                   process.env.TRUST_PROXY === '1' || 
                   process.env.NODE_ENV === 'production';

app.set('trust proxy', trustProxy);

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
            'https://telegram-moderator-dashboard.vercel.app',
            process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
            'http://localhost:8080', // For local development server
            'http://localhost:5173', // For Vite development server
            // Add your production domains here
        ];

        // Add additional allowed origins from environment variable
        if (process.env.ADDITIONAL_ALLOWED_ORIGINS) {
            const additionalOrigins = process.env.ADDITIONAL_ALLOWED_ORIGINS
                .split(',')
                .map(origin => origin.trim())
                .filter(origin => origin);
            allowedOrigins.push(...additionalOrigins);
        }
        
        // In development, allow all localhost origins
        if (process.env.NODE_ENV === 'development' && origin && origin.startsWith('http://localhost')) {
            return callback(null, true);
        }
        
        // Allow ngrok tunnels (for development/testing)
        if (origin && origin.match(/^https:\/\/.*\.ngrok-free\.app$/)) {
            return callback(null, true);
        }
        
        // Allow requests with no origin (like mobile apps, curl requests, or file://)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // Instead of throwing an error, deny the request by returning false
            callback(null, false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Telegram-Init-Data',
        'ngrok-skip-browser-warning', // ngrok header
        'X-Requested-With'            // Common for AJAX requests
    ],
    credentials: true,
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Middleware to handle ngrok-specific requirements
app.use((req, res, next) => {
    // Add ngrok skip browser warning header to all responses
    res.header('ngrok-skip-browser-warning', 'true');
    
    // Handle preflight requests for ngrok
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Telegram-Init-Data, ngrok-skip-browser-warning, X-Requested-With');
        res.header('Access-Control-Allow-Credentials', 'true');
        return res.status(200).end();
    }
    
    next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
    message: {
        status: 'error',
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests from this IP, please try again later.',
            statusCode: 429,
            timestamp: new Date().toISOString()
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for health checks and docs
    skip: (req) => {
        const skipPaths = ['/api/v1/health', '/api/docs', '/'];
        return skipPaths.includes(req.path);
    },
    // Validate proxy headers only when behind a proxy
    validate: {
        xForwardedForHeader: trustProxy
    },
    handler: (req, res) => {
        throw ApiError.fromType(ERROR_TYPES.RATE_LIMIT_EXCEEDED);
    }
});

app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5, // Limit each IP to 5 auth requests per windowMs
    message: {
        status: 'error',
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many authentication attempts, please try again later.',
            statusCode: 429,
            timestamp: new Date().toISOString()
        }
    },
    // Validate proxy headers only when behind a proxy
    validate: {
        xForwardedForHeader: trustProxy
    },
    handler: (req, res) => {
        throw ApiError.fromType(ERROR_TYPES.RATE_LIMIT_EXCEEDED, 'Too many authentication attempts');
    }
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

app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf, encoding) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            throw ApiError.badRequest('Invalid JSON payload');
        }
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global maintenance check middleware
app.use(maintenanceCheck);

// Root endpoint - API information
app.get('/', (req, res) => {
    res.status(200).json({
        name: 'Telegram Moderator Bot API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/v1/health',
            docs: '/api/docs',
            auth: '/api/v1/auth',
            groups: '/api/v1/groups',
            webapp: '/api/v1/webapp',
            nlp: '/api/v1/nlp'
        },
        documentation: `${req.protocol}://${req.get('host')}/api/docs`
    });
});

// Global health check endpoint - accessible without CORS restrictions
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'telegram-moderator-bot-api',
        version: '1.0.0'
    });
});

// Handle OPTIONS requests for health endpoints explicitly
app.options('/api/v1/health', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).send();
});

// Stricter rate limiting for auth endpoints
app.use('/api/v1/auth', authLimiter);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/webapp', webAppRoutes);
app.use('/api/v1/nlp', nlpRoutes);

// 404 handler for API endpoints
app.use('/api', (req, res, next) => {
    next(ApiError.fromType(ERROR_TYPES.ENDPOINT_NOT_FOUND, `API endpoint ${req.method} ${req.path} not found`));
});

// Global 404 handler
app.use((req, res, next) => {
    next(ApiError.fromType(ERROR_TYPES.NOT_FOUND, `Resource ${req.path} not found`));
});

// Global error handler
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