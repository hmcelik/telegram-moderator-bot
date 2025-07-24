import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// Import your actual routes and error handlers
import groupRoutes from '../../src/api/routes/groups.js';
import errorResponder from '../../src/api/utils/errorResponder.js';
import * as db from '../../src/common/services/database.js';
import * as telegram from '../../src/common/services/telegram.js';

// Mock middleware and services
vi.mock('../../src/common/services/database.js');
vi.mock('../../src/common/services/telegram.js');

const app = express();
app.use(express.json());
app.use('/api/v1/groups', groupRoutes);
app.use(errorResponder);

// Generate a valid token for an admin user and a non-admin user
const ADMIN_ID = '12345';
const NON_ADMIN_ID = '67890';
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const adminToken = jwt.sign({ id: ADMIN_ID }, JWT_SECRET);
const nonAdminToken = jwt.sign({ id: NON_ADMIN_ID }, JWT_SECRET);

describe('Group API Endpoints', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /groups', () => {
    it('should return a list of groups the user is an admin of', async () => {
      // Mock DB to return two groups
      db.getAllGroups.mockResolvedValue([
        { chatId: '-1001', chatTitle: 'Admin Group' },
        { chatId: '-1002', chatTitle: 'Non-Admin Group' }
      ]);
      // Mock Telegram to confirm user is admin of the first group only
      telegram.getChatAdmins.mockImplementation(chatId => {
        if (chatId === '-1001') return Promise.resolve([ADMIN_ID]);
        return Promise.resolve(['99999']); // Different admin
      });

      const response = await request(app)
        .get('/api/v1/groups')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].chatTitle).toBe('Admin Group');
    });
  });

  describe('GET /groups/:groupId/settings', () => {
    it('should return 401 if no token is provided', async () => {
      const response = await request(app).get('/api/v1/groups/-1001/settings');
      expect(response.status).toBe(401);
    });

    it('should return settings for an admin', async () => {
      telegram.getChatAdmins.mockResolvedValue([ADMIN_ID]);
      db.getSetting.mockResolvedValue('some_value'); // Mocking getSetting

      const response = await request(app)
        .get('/api/v1/groups/-1001/settings')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should return 403 for a non-admin', async () => {
      telegram.getChatAdmins.mockResolvedValue([ADMIN_ID]); // only admin is 12345

      const response = await request(app)
        .get('/api/v1/groups/-1001/settings')
        .set('Authorization', `Bearer ${nonAdminToken}`); // User 67890 tries to access

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /groups/:groupId/settings', () => {
    it('should allow an admin to update settings', async () => {
      telegram.getChatAdmins.mockResolvedValue([ADMIN_ID]);
      db.setSetting.mockResolvedValue();

      const newSettings = { kickLevel: 5 };

      const response = await request(app)
        .put('/api/v1/groups/-1001/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ settings: newSettings });

      expect(response.status).toBe(200);
      expect(db.setSetting).toHaveBeenCalledWith('-1001', 'kickLevel', 5);
    });
  });
});