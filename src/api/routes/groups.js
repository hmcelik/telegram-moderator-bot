import express from 'express';
import * as groupController from '../controllers/groupController.js';
import { checkJwt } from '../middleware/checkJwt.js';
import { checkGroupAdmin } from '../middleware/checkGroupAdmin.js';
import { body, param } from 'express-validator';


const router = express.Router();

// All group routes require a valid JWT
router.use(checkJwt);

router.get('/', groupController.listGroups);

router.get('/:groupId/settings', 
    param('groupId').isString(),
    checkGroupAdmin, 
    groupController.getSettings
);

router.put('/:groupId/settings',
    param('groupId').isString(),
    body('settings').isObject(),
    checkGroupAdmin,
    groupController.updateSettings
);

router.get('/:groupId/stats',
    param('groupId').isString(),
    checkGroupAdmin,
    groupController.getStats
);


export default router;