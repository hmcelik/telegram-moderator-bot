/**
 * API Client for Telegram Moderator Bot Dashboard
 * Use this code in your dashboard to make API calls
 */

class TelegramModeratorAPI {
    constructor(baseURL = 'https://minnow-good-mostly.ngrok-free.app') {
        this.baseURL = baseURL;
        this.token = null;
    }
    
    // Set authentication token
    setToken(token) {
        this.token = token;
    }
    
    // Make authenticated API request
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        };
        
        // Add auth header if token is available
        if (this.token) {
            defaultHeaders['Authorization'] = `Bearer ${this.token}`;
        }
        
        const requestOptions = {
            method: 'GET',
            headers: {
                ...defaultHeaders,
                ...(options.headers || {})
            },
            ...options
        };
        
        // If body is provided and it's an object, stringify it
        if (requestOptions.body && typeof requestOptions.body === 'object') {
            requestOptions.body = JSON.stringify(requestOptions.body);
        }
        
        try {
            console.log(`API Request: ${requestOptions.method} ${url}`);
            
            const response = await fetch(url, requestOptions);
            
            console.log(`API Response: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.error?.message || errorJson.message || errorText;
                } catch {
                    errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // Health check
    async health() {
        return this.makeRequest('/api/v1/health');
    }
    
    // WebApp health check
    async webappHealth() {
        return this.makeRequest('/api/v1/webapp/health');
    }
    
    // Authenticate with Telegram Login Widget
    async authenticateLoginWidget(telegramData) {
        return this.makeRequest('/api/v1/auth/login-widget', {
            method: 'POST',
            body: telegramData
        });
    }
    
    // Authenticate with Telegram WebApp
    async authenticateWebApp(initData) {
        return this.makeRequest('/api/v1/webapp/auth', {
            method: 'POST',
            headers: {
                'X-Telegram-Init-Data': initData
            }
        });
    }
    
    // Get user's groups (requires authentication)
    async getGroups() {
        return this.makeRequest('/api/v1/groups');
    }
    
    // Get user's groups via WebApp endpoint
    async getUserGroups() {
        return this.makeRequest('/api/v1/webapp/user/groups', {
            headers: {
                'X-Telegram-Init-Data': this.telegramInitData
            }
        });
    }
    
    // Get group settings
    async getGroupSettings(groupId) {
        return this.makeRequest(`/api/v1/groups/${groupId}/settings`);
    }
    
    // Update group settings
    async updateGroupSettings(groupId, settings) {
        return this.makeRequest(`/api/v1/groups/${groupId}/settings`, {
            method: 'PUT',
            body: { settings }
        });
    }
    
    // Get group stats
    async getGroupStats(groupId) {
        return this.makeRequest(`/api/v1/groups/${groupId}/stats`);
    }
    
    // Test spam detection
    async testSpam(text, whitelistedKeywords = []) {
        return this.makeRequest('/api/v1/nlp/test/spam', {
            method: 'POST',
            body: { text, whitelistedKeywords }
        });
    }
    
    // Test profanity detection
    async testProfanity(text) {
        return this.makeRequest('/api/v1/nlp/test/profanity', {
            method: 'POST',
            body: { text }
        });
    }
    
    // Analyze message
    async analyzeMessage(text, whitelistedKeywords = [], groupId = null) {
        return this.makeRequest('/api/v1/nlp/analyze', {
            method: 'POST',
            body: { text, whitelistedKeywords, groupId }
        });
    }
}

// Usage examples:
/*
// Initialize API client
const api = new TelegramModeratorAPI();

// Test connection
try {
    const health = await api.health();
    console.log('API is healthy:', health);
} catch (error) {
    console.error('API health check failed:', error.message);
}

// Authenticate and get groups
try {
    // For Login Widget
    const authResult = await api.authenticateLoginWidget(telegramLoginData);
    api.setToken(authResult.token);
    
    // Or for WebApp
    // const authResult = await api.authenticateWebApp(window.Telegram.WebApp.initData);
    // api.setToken(authResult.token);
    
    // Get user's groups
    const groups = await api.getGroups();
    console.log('User groups:', groups);
} catch (error) {
    console.error('Authentication or groups fetch failed:', error.message);
}
*/

// Export for use in your dashboard
export default TelegramModeratorAPI;

// Or if not using modules, make it global
if (typeof window !== 'undefined') {
    window.TelegramModeratorAPI = TelegramModeratorAPI;
}
