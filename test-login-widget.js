import crypto from 'crypto';

// Your bot token from .env
const BOT_TOKEN = '7780442610:AAFjXAcS7dSQ5g7FVbT7df8OBL--Kg3ZBGw';

// Test data (like what comes from Telegram Login Widget)
const userData = {
    id: '5057224206',
    first_name: 'Test User',
    username: 'testuser',
    photo_url: 'https://example.com/photo.jpg',
    auth_date: Math.floor(Date.now() / 1000).toString()
};

// Generate valid hash using the same algorithm as the server
function generateValidHash(data, botToken) {
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    
    const dataCheckString = Object.keys(data)
        .sort()
        .filter(key => data[key] !== undefined && data[key] !== null && data[key] !== '')
        .map(key => `${key}=${data[key]}`)
        .join('\n');

    console.log('Data check string:', dataCheckString);

    const hmac = crypto.createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

    return hmac;
}

// Generate a valid hash
const validHash = generateValidHash(userData, BOT_TOKEN);

// Final data to send to server
const testPayload = {
    ...userData,
    hash: validHash
};

console.log('Valid test payload:', JSON.stringify(testPayload, null, 2));

// Test the request
fetch('http://localhost:3000/api/v1/auth/login-widget', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://telegram-moderator-dashboard.vercel.app'
    },
    body: JSON.stringify(testPayload)
})
.then(response => response.json())
.then(data => {
    console.log('✅ Server response:', data);
})
.catch(error => {
    console.error('❌ Error:', error);
});
