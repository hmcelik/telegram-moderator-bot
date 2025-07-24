import 'dotenv/config'; // Make sure environment variables are loaded
import express from 'express';
import cors from 'cors';

// Your existing service to initialize the database
import { initializeDatabase } from '../common/services/database.js';
import logger from '../common/services/logger.js';

// API Routes
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
// import billingRoutes from './api/routes/billing.js'; // Uncomment when ready

// Error Handling
import errorResponder from './utils/errorResponder.js';
import ApiError from './utils/apiError.js';


const startServer = async () => {
    try {
        // 1. Initialize Database
        await initializeDatabase();
        logger.info('Database initialized successfully for API server.');

        // 2. Create Express App
        const app = express();
        const PORT = process.env.API_PORT || 3000;

        // 3. Core Middleware
        app.use(cors()); // Enable Cross-Origin Resource Sharing
        app.use(express.json()); // Parse JSON bodies
        app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
        app.get('/', (req, res) => {
            res.status(200).json({
                message: '🚀 Aegis Bot API is running!',
                status: 'ok',
                documentation: '/api-docs' // (Optional) a link to your future docs
             });
        });

        // 4. API Routes
        app.use('/api/v1/auth', authRoutes);
        app.use('/api/v1/groups', groupRoutes);
        // app.use('/api/v1/billing', billingRoutes); // Uncomment when ready

        // 5. Handle 404 - Not Found
        app.use((req, res, next) => {
            next(new ApiError(404, 'Not Found'));
        });

        // 6. Global Error Handler (must be the last middleware)
        app.use(errorResponder);

        // 7. Start Listening
        app.listen(PORT, () => {
            logger.info(`🚀 API Server is running on http://localhost:${PORT}`);
        });

    } catch (error) {
        logger.error('Failed to start API server:', error);
        process.exit(1);
    }
};

startServer();