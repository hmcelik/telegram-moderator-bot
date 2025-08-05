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

export const loginWidget = async (req, res, next) => {
    try {
        // The user object is attached by the verifyTelegramAuth middleware
        const { user } = req;
        
        // Ensure user is in our database
        await db.upsertUser(user);

        // Create a JWT token for API access
        const token = tokenService.generateToken({ 
            id: user.id,
            username: user.username,
            first_name: user.first_name 
        });

        res.status(200).json({
            success: true,
            token: token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                username: user.username,
                photo_url: user.photo_url
            }
        });
    } catch (error) {
        next(error);
    }
};