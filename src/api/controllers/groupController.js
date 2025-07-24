import * as db from '../../common/services/database.js';
import { getGroupSettings, updateSetting } from '../../common/config/index.js';
import { getChatMember, getChatAdmins } from '../../common/services/telegram.js';
import ApiError from '../utils/apiError.js';

export const listGroups = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const allGroups = await db.getAllGroups();
        const userAdminGroups = [];

        for (const group of allGroups) {
            try {
                const admins = await getChatAdmins(group.chatId);
                if (admins.includes(userId)) {
                    userAdminGroups.push(group);
                }
            } catch (err) {
                // Ignore groups where the bot might not have admin rights to fetch admins
            }
        }
        res.status(200).json(userAdminGroups);
    } catch (error) {
        next(error);
    }
};

export const getSettings = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const settings = await getGroupSettings(groupId);
        res.status(200).json(settings);
    } catch (error) {
        next(error);
    }
};

export const updateSettings = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { settings } = req.body;
        
        for (const key in settings) {
            await updateSetting(groupId, key, settings[key]);
        }

        const updatedSettings = await getGroupSettings(groupId);
        res.status(200).json({
            message: 'Settings updated successfully.',
            settings: updatedSettings
        });
    } catch (error) {
        next(error);
    }
};

export const getStats = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const group = await db.getGroup(groupId);
        if (!group) {
            throw new ApiError(404, 'Group not found');
        }
        
        const deletionsToday = await db.getTotalDeletionsToday(groupId);
        // This can be expanded to include more stats from the audit_log
        const auditLog = await db.getAuditLog(groupId, 100); 

        res.status(200).json({
            totalMessagesProcessed: auditLog.length, // Placeholder, needs better logic
            violationsDetected: auditLog.length,
            actionsTaken: auditLog.length,
            deletionsToday
        });
    } catch (error) {
        next(error);
    }
};