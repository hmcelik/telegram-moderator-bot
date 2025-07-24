import express from 'express';
import * as authController from '../controllers/authController.js';
import { verifyTelegramAuth } from '../middleware/verifyTelegramAuth.js';

const router = express.Router();

router.post('/verify', verifyTelegramAuth, authController.verify);

export default router;