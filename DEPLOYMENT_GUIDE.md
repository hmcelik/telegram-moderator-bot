# Deployment Guide for Telegram Moderator Bot API

This guide covers deploying the Telegram Moderator Bot API to various cloud platforms.

## 🚀 Vercel Deployment

### Prerequisites
- [Vercel CLI](https://vercel.com/download) installed
- GitHub repository connected to Vercel

### Environment Variables for Production

Create a `.env.production` file or set these in your Vercel dashboard:

```bash
# Required
TELEGRAM_BOT_TOKEN=your_bot_token_here
ADMIN_USER_ID=your_user_id_here
OPENAI_API_KEY=your_openai_api_key_here

# API Configuration
NODE_ENV=production
API_PORT=3000
API_BASE_URL=https://your-vercel-app.vercel.app
TRUST_PROXY=true

# CORS Configuration
ALLOWED_ORIGIN=https://telegram-moderator-dashboard.vercel.app
ADDITIONAL_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Security
JWT_SECRET=your-super-long-random-secret-string-here

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5
```

### Vercel Configuration (`vercel.json`)

Create a `vercel.json` file in your project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/api/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/api/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "TRUST_PROXY": "true"
  },
  "functions": {
    "src/api/server.js": {
      "maxDuration": 30
    }
  }
}
```

### Deployment Steps

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables** (via Vercel dashboard or CLI):
   ```bash
   vercel env add TELEGRAM_BOT_TOKEN
   vercel env add ADMIN_USER_ID
   vercel env add OPENAI_API_KEY
   # ... add all other variables
   ```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "src/api/server.js"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  telegram-bot-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - TRUST_PROXY=true
      - API_PORT=3000
    env_file:
      - .env.production
    restart: unless-stopped
    volumes:
      - ./data:/app/data
```

### Build and Run
```bash
# Build the image
docker build -t telegram-moderator-bot .

# Run with environment file
docker run -d --name telegram-bot-api \
  --env-file .env.production \
  -p 3000:3000 \
  telegram-moderator-bot
```

## ☁️ Other Cloud Platforms

### Railway
1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

### Heroku
1. Create a `Procfile`:
   ```
   web: node src/api/server.js
   ```

2. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set TRUST_PROXY=true
   heroku config:set TELEGRAM_BOT_TOKEN=your_token
   # ... set all other variables
   ```

3. Deploy:
   ```bash
   git push heroku main
   ```

### AWS Lambda (Serverless)
Install serverless framework and configure `serverless.yml`:

```yaml
service: telegram-moderator-bot

provider:
  name: aws
  runtime: nodejs18.x
  environment:
    NODE_ENV: production
    TRUST_PROXY: true

functions:
  api:
    handler: src/api/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
```

Create `src/api/lambda.js`:
```javascript
import serverless from 'serverless-http';
import app from './server.js';

export const handler = serverless(app);
```

## 🔧 Production Considerations

### 1. Database
- Consider using a managed database service (PostgreSQL, MySQL) instead of SQLite for production
- Set up regular backups
- Use connection pooling

### 2. Monitoring
- Set up error tracking (Sentry, Bugsnag)
- Monitor API performance and usage
- Set up health check endpoints

### 3. Security
- Use HTTPS in production
- Set up proper CORS policies
- Implement API rate limiting
- Use secure JWT secrets
- Regular security updates

### 4. Environment Variables Checklist
- [ ] `TELEGRAM_BOT_TOKEN` - Your bot token
- [ ] `ADMIN_USER_ID` - Your Telegram user ID
- [ ] `OPENAI_API_KEY` - For AI features
- [ ] `NODE_ENV=production` - Environment mode
- [ ] `TRUST_PROXY=true` - For proxy detection
- [ ] `API_BASE_URL` - Your production URL
- [ ] `ALLOWED_ORIGIN` - Your frontend domain
- [ ] `JWT_SECRET` - Secure random string

### 5. Post-Deployment Testing
After deployment, test these endpoints:

```bash
# Health check
curl https://your-api.vercel.app/api/v1/health

# API documentation
curl https://your-api.vercel.app/api/docs

# Root endpoint
curl https://your-api.vercel.app/
```

## 🔗 Integration with Frontend

Update your frontend configuration to use the production API URL:

```javascript
// In your frontend application
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api.vercel.app'
  : 'http://localhost:3000';
```

## 📞 Support

If you encounter issues during deployment:

1. Check the deployment logs
2. Verify all environment variables are set
3. Test the API endpoints
4. Check CORS configuration
5. Ensure the Telegram bot token is valid

For more detailed troubleshooting, refer to the main README.md file.
