import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from '../common/services/database.js';
import logger from '../common/services/logger.js';
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import errorResponder from './utils/errorResponder.js';
import ApiError from './utils/apiError.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/groups', groupRoutes);

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