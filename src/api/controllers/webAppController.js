import * as tokenService from '../services/tokenService.js';
import * as db from '../../common/services/database.js';
import { getGroupSettings as getConfigGroupSettings } from '../../common/config/index.js';
import logger from '../../common/services/logger.js';
import ApiError from '../utils/apiError.js';

/**
 * Authenticate Telegram WebApp user and return JWT token
 */
export const authenticate = async (req, res, next) => {
    try {
        const { telegramUser } = req;
        
        // Ensure user is in our database
        await db.upsertUser({
            id: telegramUser.id,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name || null,
            username: telegramUser.username || null,
            language_code: telegramUser.language_code || 'en'
        });

        // Create a session token (JWT)
        const token = tokenService.generateToken({ 
            id: telegramUser.id,
            type: 'webapp'
        });

        logger.info(`WebApp user authenticated: ${telegramUser.id}`);

        res.status(200).json({
            success: true,
            message: 'Authentication successful',
            token: token,
            user: {
                id: telegramUser.id,
                first_name: telegramUser.first_name,
                last_name: telegramUser.last_name,
                username: telegramUser.username,
                language_code: telegramUser.language_code
            }
        });
    } catch (error) {
        logger.error('Error in authenticate:', error);
        next(new ApiError(500, 'Authentication failed'));
    }
};

/**
 * Get user profile information
 */
export const getUserProfile = async (req, res, next) => {
    try {
        const { telegramUser } = req;
        
        // Get user from database
        const user = await db.getUser(telegramUser.id);
        if (!user) {
            return next(new ApiError(404, 'User not found'));
        }

        // Get user's admin groups
        const adminGroups = await db.getUserAdminGroups(telegramUser.id);

        res.status(200).json({
            success: true,
            data: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                username: user.username,
                language_code: user.language_code,
                admin_groups_count: adminGroups.length,
                created_at: user.created_at
            }
        });
    } catch (error) {
        logger.error('Error in getUserProfile:', error);
        next(new ApiError(500, 'Failed to get user profile'));
    }
};

/**
 * Get list of groups where user is admin
 */
export const getUserGroups = async (req, res, next) => {
    try {
        const { telegramUser } = req;
        
        const adminGroups = await db.getUserAdminGroups(telegramUser.id);

        res.status(200).json({
            success: true,
            data: adminGroups.map(group => ({
                id: group.id,
                title: group.title,
                type: group.type,
                member_count: group.member_count,
                created_at: group.created_at
            }))
        });
    } catch (error) {
        logger.error('Error in getUserGroups:', error);
        next(new ApiError(500, 'Failed to get user groups'));
    }
};

/**
 * Get group settings
 */
export const getGroupSettingsWebApp = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { telegramUser } = req;
        
        // Check if user is admin of this group
        const isAdmin = await db.isUserGroupAdmin(telegramUser.id, groupId);
        if (!isAdmin) {
            return next(new ApiError(403, 'Access denied. User is not admin of this group'));
        }

        const settings = await getConfigGroupSettings(groupId);

        res.status(200).json({
            success: true,
            data: {
                groupId,
                settings: {
                    alertLevel: settings.alertLevel,
                    muteLevel: settings.muteLevel,
                    kickLevel: settings.kickLevel,
                    banLevel: settings.banLevel,
                    spamThreshold: settings.spamThreshold,
                    muteDurationMinutes: settings.muteDurationMinutes,
                    warningMessage: settings.warningMessage,
                    warningMessageDeleteSeconds: settings.warningMessageDeleteSeconds,
                    keywordWhitelistBypass: settings.keywordWhitelistBypass,
                    strikeExpirationDays: settings.strikeExpirationDays,
                    goodBehaviorDays: settings.goodBehaviorDays,
                    whitelistedKeywords: settings.whitelistedKeywords
                }
            }
        });
    } catch (error) {
        logger.error('Error in getGroupSettings:', error);
        next(new ApiError(500, 'Failed to get group settings'));
    }
};

/**
 * Update group settings
 */
export const updateGroupSettingsWebApp = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { telegramUser } = req;
        const { settings } = req.body;
        
        // Check if user is admin of this group
        const isAdmin = await db.isUserGroupAdmin(telegramUser.id, groupId);
        if (!isAdmin) {
            return next(new ApiError(403, 'Access denied. User is not admin of this group'));
        }

        // Validate settings
        const validSettings = [
            'alertLevel', 'muteLevel', 'kickLevel', 'banLevel', 
            'spamThreshold', 'muteDurationMinutes', 'warningMessage',
            'warningMessageDeleteSeconds', 'keywordWhitelistBypass',
            'strikeExpirationDays', 'goodBehaviorDays'
        ];

        // Update each setting
        for (const [key, value] of Object.entries(settings)) {
            if (validSettings.includes(key)) {
                await db.setSetting(groupId, key, value);
            }
        }

        // Handle whitelisted keywords separately
        if (settings.whitelistedKeywords && Array.isArray(settings.whitelistedKeywords)) {
            await db.setWhitelistKeywords(groupId, settings.whitelistedKeywords);
        }

        logger.info(`Settings updated for group ${groupId} by user ${telegramUser.id}`);

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        logger.error('Error in updateGroupSettings:', error);
        next(new ApiError(500, 'Failed to update group settings'));
    }
};

/**
 * Get group moderation statistics
 */
export const getGroupStats = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { telegramUser } = req;
        const { period = 'week' } = req.query;
        
        // Check if user is admin of this group
        const isAdmin = await db.isUserGroupAdmin(telegramUser.id, groupId);
        if (!isAdmin) {
            return next(new ApiError(403, 'Access denied. User is not admin of this group'));
        }

        // Calculate date range based on period
        const now = new Date();
        let startDate;
        
        switch (period) {
            case 'day':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        // Get statistics from database
        const stats = await db.getGroupStats(groupId, startDate, now);

        res.status(200).json({
            success: true,
            data: {
                groupId,
                period,
                stats: {
                    totalMessages: stats.totalMessages || 0,
                    flaggedMessages: stats.flaggedMessages || 0,
                    deletedMessages: stats.deletedMessages || 0,
                    mutedUsers: stats.mutedUsers || 0,
                    kickedUsers: stats.kickedUsers || 0,
                    bannedUsers: stats.bannedUsers || 0,
                    averageSpamScore: stats.averageSpamScore || 0,
                    topViolationTypes: stats.topViolationTypes || []
                }
            }
        });
    } catch (error) {
        logger.error('Error in getGroupStats:', error);
        next(new ApiError(500, 'Failed to get group statistics'));
    }
};

/**
 * Health check endpoint for WebApp
 */
export const healthCheck = async (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        features: {
            webAppSupport: true,
            cors: true,
            rateLimit: true,
            authentication: true,
            swagger: true
        },
        api: {
            version: '1.0.0',
            endpoints: [
                '/api/v1/webapp/auth',
                '/api/v1/webapp/user/profile',
                '/api/v1/webapp/user/groups',
                '/api/v1/webapp/group/:groupId/settings',
                '/api/v1/webapp/group/:groupId/stats'
            ]
        }
    });
};
