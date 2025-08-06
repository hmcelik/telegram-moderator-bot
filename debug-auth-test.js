import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';

// Mock process.env
vi.stubEnv('TELEGRAM_BOT_TOKEN', 'test_bot_token');

// Create a test version of the auth middleware that logs everything
const createTestMiddleware = (botToken) => {
  const verifyTelegramAuth = (req, res, next) => {
    const body = req.body;
    
    console.log('=== MIDDLEWARE DEBUG ===');
    console.log('BOT_TOKEN:', botToken);
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Mini App initData verification
    if (typeof body.initData === 'string') {
      try {
        console.log('Processing Mini App initData...');
        
        // Parse initData
        const params = new URLSearchParams(body.initData);
        const parsedData = {};
        for (const [key, value] of params.entries()) {
          if (key === 'user') {
            parsedData.user = JSON.parse(value);
          } else {
            parsedData[key] = value;
          }
        }
        
        console.log('Parsed initData:', JSON.stringify(parsedData, null, 2));
        
        if (!parsedData.hash || !parsedData.user) {
          console.log('Missing hash or user in initData');
          return res.status(400).json({ error: { message: 'Invalid initData format' } });
        }
        
        // Verify hash
        const { hash, ...dataForHash } = parsedData;
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        
        const dataCheckString = Object.keys(dataForHash)
          .sort()
          .map(key => {
            const value = typeof dataForHash[key] === 'object' ? JSON.stringify(dataForHash[key]) : dataForHash[key];
            return `${key}=${value}`;
          })
          .join('\n');
        
        const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
        
        console.log('Data for hash:', JSON.stringify(dataForHash, null, 2));
        console.log('Data check string:', JSON.stringify(dataCheckString));
        console.log('Secret key:', secretKey.toString('hex'));
        console.log('Expected hash:', expectedHash);
        console.log('Received hash:', hash);
        console.log('Hashes match:', expectedHash === hash);
        
        if (expectedHash === hash) {
          req.user = {
            id: parsedData.user.id,
            first_name: parsedData.user.first_name,
            username: parsedData.user.username,
            photo_url: parsedData.user.photo_url,
            auth_date: parsedData.auth_date
          };
          return next();
        } else {
          return res.status(401).json({ error: { message: 'Invalid Telegram Mini App data. Hash verification failed.' } });
        }
      } catch (error) {
        console.log('Error processing initData:', error);
        return res.status(400).json({ error: { message: 'Invalid initData format' } });
      }
    }
    
    // Login Widget verification
    if (body.id && body.hash) {
      console.log('Processing Login Widget data...');
      
      const { hash, ...userData } = body;
      const secretKey = crypto.createHash('sha256').update(botToken).digest();
      
      const dataCheckString = Object.keys(userData)
        .sort()
        .filter(key => userData[key] !== undefined && userData[key] !== null && userData[key] !== '')
        .map(key => `${key}=${userData[key]}`)
        .join('\n');
      
      const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
      
      console.log('Widget data:', JSON.stringify(userData, null, 2));
      console.log('Widget data check string:', JSON.stringify(dataCheckString));
      console.log('Widget secret key:', secretKey.toString('hex'));
      console.log('Widget expected hash:', expectedHash);
      console.log('Widget received hash:', hash);
      console.log('Widget hashes match:', expectedHash === hash);
      
      if (expectedHash === hash) {
        req.user = userData;
        return next();
      } else {
        return res.status(401).json({ error: { message: 'Invalid Telegram Login Widget data. Hash verification failed.' } });
      }
    }
    
    console.log('No valid auth data found');
    return res.status(400).json({ error: { message: 'Authentication data is missing' } });
  };
  
  return verifyTelegramAuth;
};

// Mock auth controller
const authController = {
  verify: (req, res) => {
    res.json({ 
      token: 'mock_jwt_token',
      message: 'Authentication successful'
    });
  }
};

// Create test app
const app = express();
app.use(express.json());

// Add test middleware and route
app.post('/api/v1/auth/verify', createTestMiddleware('test_bot_token'), authController.verify);

describe('Debug Auth Test', () => {
  it('should debug Mini App authentication', async () => {
    const userData = {
      id: 123456,
      first_name: 'Test',
      username: 'testuser'
    };
    const auth_date = Math.floor(Date.now() / 1000);
    
    // Create hash using same method as middleware
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update('test_bot_token').digest();
    const dataToCheck = {
      auth_date: auth_date,
      user: userData
    };
    
    const dataCheckString = Object.keys(dataToCheck)
      .sort()
      .map(key => {
        const value = typeof dataToCheck[key] === 'object' ? JSON.stringify(dataToCheck[key]) : dataToCheck[key];
        return `${key}=${value}`;
      })
      .join('\n');
      
    const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    const initData = `auth_date=${auth_date}&hash=${hash}&user=${encodeURIComponent(JSON.stringify(userData))}`;

    console.log('\n=== TEST DEBUG ===');
    console.log('Test initData:', initData);
    console.log('Test dataCheckString:', JSON.stringify(dataCheckString));
    console.log('Test hash:', hash);

    const response = await request(app)
      .post('/api/v1/auth/verify')
      .send({ initData });

    console.log('Response status:', response.status);
    console.log('Response body:', response.body);

    expect(response.status).toBe(200);
  });
});
