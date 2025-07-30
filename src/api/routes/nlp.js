import express from 'express';
import * as nlpController from '../controllers/nlpController.js';
import { checkJwt } from '../middleware/checkJwt.js';
import { body } from 'express-validator';

const router = express.Router();

// All NLP routes require a valid JWT
router.use(checkJwt);

// Get NLP service status
router.get('/status', nlpController.getNLPStatus);

// Test spam detection
router.post('/test/spam',
    body('text').isString().isLength({ min: 1, max: 4000 }),
    body('whitelistedKeywords').optional().isArray(),
    nlpController.testSpamDetection
);

// Test profanity detection  
router.post('/test/profanity',
    body('text').isString().isLength({ min: 1, max: 4000 }),
    nlpController.testProfanityDetection
);

// Complete message analysis
router.post('/analyze',
    body('text').isString().isLength({ min: 1, max: 4000 }),
    body('whitelistedKeywords').optional().isArray(),
    body('groupId').optional().isString(),
    nlpController.analyzeMessageEndpoint
);

export default router;
