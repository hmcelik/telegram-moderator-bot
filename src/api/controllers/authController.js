import * as tokenService from '../services/tokenService.js';
import * as db from '../../common/services/database.js';

export const verify = async (req, res, next) => {
    try {
        // The user object is attached by the verifyTelegramAuth middleware
        const { user } = req;
        
        // Ensure user is in our database
        await db.upsertUser(user);

        // Create a session token (JWT)
        const token = tokenService.generateToken({ id: user.id });

        res.status(200).json({
            message: 'Authentication successful',
            token: token
        });
    } catch (error) {
        next(error);
    }
};