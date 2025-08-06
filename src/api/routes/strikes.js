import express from 'express';
import * as strikeController from '../controllers/strikeController.js';
import { checkJwt } from '../middleware/checkJwt.js';
import { checkGroupAdmin } from '../middleware/checkGroupAdmin.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

// All strike routes require a valid JWT and group admin privileges
router.use(checkJwt);

/**
 * @swagger
 * /api/v1/groups/{groupId}/users/{userId}/strikes:
 *   get:
 *     summary: Get user's detailed strike history
 *     tags: [Strike Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of history entries to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of entries to skip
 *       - in: query
 *         name: includeHistory
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: true
 *         description: Whether to include detailed strike history
 *     responses:
 *       200:
 *         description: User strike information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 groupId:
 *                   type: string
 *                 currentStrikes:
 *                   type: integer
 *                 lastStrikeTimestamp:
 *                   type: string
 *                   format: date-time
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       type:
 *                         type: string
 *                       action:
 *                         type: string
 *                       amount:
 *                         type: integer
 *                       reason:
 *                         type: string
 *                       admin:
 *                         type: object
 *                         nullable: true
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     offset:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a group admin
 *       404:
 *         description: Group not found
 */
router.get('/:groupId/users/:userId/strikes',
    param('groupId').isString().notEmpty(),
    param('userId').isString().notEmpty(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('includeHistory').optional().isIn(['true', 'false']),
    checkGroupAdmin,
    strikeController.getUserStrikes
);

/**
 * @swagger
 * /api/v1/groups/{groupId}/users/{userId}/strikes:
 *   post:
 *     summary: Add strikes to a user
 *     tags: [Strike Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 description: Number of strikes to add
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Reason for adding strikes
 *                 default: "API strike addition"
 *     responses:
 *       200:
 *         description: Strikes added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     groupId:
 *                       type: string
 *                     previousCount:
 *                       type: integer
 *                     newCount:
 *                       type: integer
 *                     amountAdded:
 *                       type: integer
 *                     reason:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a group admin
 */
router.post('/:groupId/users/:userId/strikes',
    param('groupId').isString().notEmpty(),
    param('userId').isString().notEmpty(),
    body('amount').isInt({ min: 1, max: 100 }),
    body('reason').optional().isString().isLength({ max: 500 }),
    checkGroupAdmin,
    strikeController.addUserStrikes
);

/**
 * @swagger
 * /api/v1/groups/{groupId}/users/{userId}/strikes:
 *   delete:
 *     summary: Remove strikes from a user
 *     tags: [Strike Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 1
 *                 description: Number of strikes to remove
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Reason for removing strikes
 *                 default: "API strike removal"
 *     responses:
 *       200:
 *         description: Strikes removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     groupId:
 *                       type: string
 *                     previousCount:
 *                       type: integer
 *                     newCount:
 *                       type: integer
 *                     amountRemoved:
 *                       type: integer
 *                     reason:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a group admin
 */
router.delete('/:groupId/users/:userId/strikes',
    param('groupId').isString().notEmpty(),
    param('userId').isString().notEmpty(),
    body('amount').optional().isInt({ min: 1, max: 100 }),
    body('reason').optional().isString().isLength({ max: 500 }),
    checkGroupAdmin,
    strikeController.removeUserStrikes
);

/**
 * @swagger
 * /api/v1/groups/{groupId}/users/{userId}/strikes:
 *   put:
 *     summary: Set a specific strike count for a user
 *     tags: [Strike Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - count
 *             properties:
 *               count:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 1000
 *                 description: Strike count to set
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Reason for setting strike count
 *                 default: "API strike count set"
 *     responses:
 *       200:
 *         description: Strike count set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     groupId:
 *                       type: string
 *                     previousCount:
 *                       type: integer
 *                     newCount:
 *                       type: integer
 *                     countSet:
 *                       type: integer
 *                     reason:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a group admin
 */
router.put('/:groupId/users/:userId/strikes',
    param('groupId').isString().notEmpty(),
    param('userId').isString().notEmpty(),
    body('count').isInt({ min: 0, max: 1000 }),
    body('reason').optional().isString().isLength({ max: 500 }),
    checkGroupAdmin,
    strikeController.setUserStrikes
);

export default router;
