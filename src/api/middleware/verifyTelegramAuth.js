import crypto from 'crypto';
import ApiError from '../utils/apiError.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export const verifyTelegramAuth = (req, res, next) => {
    const { hash, ...userData } = req.body;

    if (!hash) {
        return next(new ApiError(400, 'Hash is missing from Telegram data.'));
    }

    const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
    
    const dataCheckString = Object.keys(userData)
        .sort()
        .map(key => `${key}=${userData[key]}`)
        .join('\n');

    const hmac = crypto.createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

    if (hmac === hash) {
        req.user = userData; // Attach user data to the request object
        return next();
    }

    return next(new ApiError(401, 'Invalid Telegram data. Hash verification failed.'));
};