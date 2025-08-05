import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';

// Import your actual routes and error handlers
import authRoutes from '../../src/api/routes/auth.js';
import errorResponder from '../../src/api/utils/errorResponder.js';
import * as db from '../../src/common/services/database.js';

// Mock the database
vi.mock('../../src/common/services/database.js');

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use(errorResponder);

describe('Enhanced Auth API Endpoints', () => {
  const BOT_TOKEN = 'test_bot_token';
  
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;
    db.upsertUser.mockResolvedValue();
  });

  describe('Mini App initData Authentication', () => {
    it('should authenticate with valid Mini App initData', async () => {
      // Create mock initData exactly as Telegram would send it
      const userData = {
        id: 123456,
        first_name: 'Test',
        username: 'testuser'
      };
      const auth_date = Math.floor(Date.now() / 1000);
      
      // Create valid hash for initData (Mini App format)
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
      const dataCheckString = [
        `auth_date=${auth_date}`,
        `user=${JSON.stringify(userData)}`
      ].sort().join('\n');
      const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
      
      // Simulate initData format as received from window.Telegram.WebApp.initData
      const initData = `user=${encodeURIComponent(JSON.stringify(userData))}&auth_date=${auth_date}&hash=${hash}`;

      const response = await request(app)
        .post('/api/v1/auth/verify')
        .send({ initData });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(db.upsertUser).toHaveBeenCalledOnce();
    });

    it('should reject invalid Mini App initData hash', async () => {
      const userData = {
        id: 123456,
        first_name: 'Test',
        username: 'testuser'
      };
      const auth_date = Math.floor(Date.now() / 1000);
      
      const initData = `user=${encodeURIComponent(JSON.stringify(userData))}&auth_date=${auth_date}&hash=invalid_hash`;

      const response = await request(app)
        .post('/api/v1/auth/verify')
        .send({ initData });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toContain('Invalid Telegram Mini App data');
    });
  });

  describe('Login Widget Authentication', () => {
    it('should authenticate with valid Login Widget data', async () => {
      const userData = {
        id: 123456,
        first_name: 'Test',
        username: 'testuser',
        auth_date: Math.floor(Date.now() / 1000)
      };

      // Create valid hash for login widget
      const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
      const dataCheckString = Object.keys(userData)
        .sort()
        .map(key => `${key}=${userData[key]}`)
        .join('\n');
      const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      const response = await request(app)
        .post('/api/v1/auth/verify')
        .send({ ...userData, hash });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(db.upsertUser).toHaveBeenCalledOnce();
    });

    it('should reject invalid Login Widget hash', async () => {
      const userData = {
        id: 123456,
        first_name: 'Test',
        hash: 'invalid_hash'
      };

      const response = await request(app)
        .post('/api/v1/auth/verify')
        .send(userData);

      expect(response.status).toBe(401);
      expect(response.body.error.message).toContain('Invalid Telegram Login Widget data');
    });
  });

  describe('Legacy Authentication Support', () => {
    it('should still support legacy format', async () => {
      const userData = {
        id: 123456,
        first_name: 'Test',
        username: 'testuser'
      };

      // Create valid hash using legacy method
      const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
      const dataCheckString = Object.keys(userData)
        .sort()
        .map(key => `${key}=${userData[key]}`)
        .join('\n');
      const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      const response = await request(app)
        .post('/api/v1/auth/verify')
        .send({ ...userData, hash });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for missing authentication data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Authentication data is missing');
    });

    it('should return 400 for malformed initData', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify')
        .send({ initData: 'invalid_format' });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Invalid initData format');
    });
  });
});
