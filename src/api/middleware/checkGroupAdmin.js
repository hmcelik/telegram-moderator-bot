import { getChatAdmins } from '../../common/services/telegram.js';
import ApiError from '../utils/apiError.js';

export const checkGroupAdmin = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        if (!groupId) {
            return next(new ApiError(400, 'Group ID is required.'));
        }

        const adminIds = await getChatAdmins(groupId);
        
        if (adminIds.includes(userId)) {
            return next();
        } else {
            return next(new ApiError(403, 'Forbidden. You are not an administrator of this group.'));
        }
    } catch (error) {
        // Handle cases where the bot can't fetch admins (e.g., not in group)
        if (error.response && error.response.statusCode === 403) {
             return next(new ApiError(403, 'Forbidden. Bot is not an administrator in the target group.'));
        }
        next(new ApiError(500, 'Failed to verify admin status.'));
    }
};