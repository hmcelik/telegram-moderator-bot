import crypto from 'crypto';

// Debug script to understand the exact hash format needed
const BOT_TOKEN = 'test_bot_token';

console.log('=== DEBUGGING TELEGRAM AUTH FORMATS ===\n');

// 1. Mini App initData format
console.log('1. MINI APP FORMAT:');
const userData = {
  id: 123456,
  first_name: 'Test',
  username: 'testuser'
};
const auth_date = Math.floor(Date.now() / 1000);

// Method 1: What the test is currently doing
const secretKey1 = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
const dataToCheck1 = {
  auth_date: auth_date,
  user: userData
};
const dataCheckString1 = Object.keys(dataToCheck1)
  .sort()
  .map(key => {
    const value = typeof dataToCheck1[key] === 'object' ? JSON.stringify(dataToCheck1[key]) : dataToCheck1[key];
    return `${key}=${value}`;
  })
  .join('\n');
const hash1 = crypto.createHmac('sha256', secretKey1).update(dataCheckString1).digest('hex');

console.log('Method 1 (Current test):');
console.log('secretKey:', secretKey1.toString('hex'));
console.log('dataCheckString:', JSON.stringify(dataCheckString1));
console.log('hash:', hash1);
console.log('initData:', `auth_date=${auth_date}&hash=${hash1}&user=${encodeURIComponent(JSON.stringify(userData))}`);

// Method 2: Direct from parsed initData (simulating middleware parsing)
console.log('\nMethod 2 (Middleware simulation):');
const initDataString = `auth_date=${auth_date}&hash=${hash1}&user=${encodeURIComponent(JSON.stringify(userData))}`;
const params = new URLSearchParams(initDataString);
const parsedData = {};
for (const [key, value] of params.entries()) {
  if (key === 'user') {
    parsedData.user = JSON.parse(value);
  } else {
    parsedData[key] = value;
  }
}
console.log('Parsed data:', JSON.stringify(parsedData, null, 2));

// Now create hash from parsed data (how middleware does it)
const { hash: _, ...dataForHash } = parsedData;
const dataCheckString2 = Object.keys(dataForHash)
  .sort()
  .map(key => {
    const value = typeof dataForHash[key] === 'object' ? JSON.stringify(dataForHash[key]) : dataForHash[key];
    return `${key}=${value}`;
  })
  .join('\n');
const hash2 = crypto.createHmac('sha256', secretKey1).update(dataCheckString2).digest('hex');
console.log('Middleware dataCheckString:', JSON.stringify(dataCheckString2));
console.log('Middleware hash:', hash2);
console.log('Hashes match:', hash1 === hash2);

console.log('\n2. LOGIN WIDGET FORMAT:');
const widgetData = {
  id: 123456,
  first_name: 'Test',
  username: 'testuser',
  auth_date: auth_date
};

const secretKey3 = crypto.createHash('sha256').update(BOT_TOKEN).digest();
const dataCheckString3 = Object.keys(widgetData)
  .sort()
  .filter(key => widgetData[key] !== undefined && widgetData[key] !== null && widgetData[key] !== '')
  .map(key => `${key}=${widgetData[key]}`)
  .join('\n');
const hash3 = crypto.createHmac('sha256', secretKey3).update(dataCheckString3).digest('hex');

console.log('Widget secretKey:', secretKey3.toString('hex'));
console.log('Widget dataCheckString:', JSON.stringify(dataCheckString3));
console.log('Widget hash:', hash3);
