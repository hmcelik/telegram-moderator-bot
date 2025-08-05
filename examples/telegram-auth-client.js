/**
 * Telegram Login Widget Integration Guide
 * 
 * This file shows how to integrate Telegram Login Widget with the 
 * Telegram Moderator Bot API for external websites.
 */

class TelegramAuth {
    constructor(apiBaseUrl = 'http://localhost:3000') {
        this.apiBaseUrl = apiBaseUrl;
        this.token = localStorage.getItem('telegram_auth_token');
        this.user = JSON.parse(localStorage.getItem('telegram_user') || 'null');
    }

    /**
     * Initialize Telegram Login Widget
     * @param {string} botUsername - Your bot's username (without @)
     * @param {string} containerId - ID of container element for the widget
     * @param {Function} onAuth - Callback function for successful authentication
     */
    initializeWidget(botUsername, containerId, onAuth) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container element with ID '${containerId}' not found`);
        }

        // Create script element for Telegram widget
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.setAttribute('data-telegram-login', botUsername);
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-auth-url', '#');
        script.setAttribute('data-request-access', 'write');
        script.setAttribute('data-onauth', 'onTelegramAuthCallback(user)');

        container.appendChild(script);

        // Set global callback function
        window.onTelegramAuthCallback = async (user) => {
            try {
                const result = await this.authenticate(user);
                if (onAuth) onAuth(result);
            } catch (error) {
                console.error('Authentication failed:', error);
                if (onAuth) onAuth({ success: false, error: error.message });
            }
        };
    }

    /**
     * Authenticate user with Login Widget data
     * @param {Object} userData - User data from Telegram Login Widget
     * @returns {Promise<Object>} Authentication result
     */
    async authenticate(userData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/login-widget`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Store token and user data
                this.token = result.token;
                this.user = result.user;
                localStorage.setItem('telegram_auth_token', this.token);
                localStorage.setItem('telegram_user', JSON.stringify(this.user));

                return { success: true, token: this.token, user: this.user };
            } else {
                throw new Error(result.error?.message || 'Authentication failed');
            }
        } catch (error) {
            throw new Error(`Network error: ${error.message}`);
        }
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!(this.token && this.user);
    }

    /**
     * Get current user data
     * @returns {Object|null}
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Get authentication token
     * @returns {string|null}
     */
    getToken() {
        return this.token;
    }

    /**
     * Make authenticated API request
     * @param {string} endpoint - API endpoint (without base URL)
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>}
     */
    async apiRequest(endpoint, options = {}) {
        if (!this.isAuthenticated()) {
            throw new Error('User not authenticated');
        }

        const url = `${this.apiBaseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error?.message || `HTTP ${response.status}`);
        }

        return result;
    }

    /**
     * Get user's groups
     * @returns {Promise<Array>}
     */
    async getUserGroups() {
        return this.apiRequest('/api/v1/groups');
    }

    /**
     * Get group settings
     * @param {string} groupId - Group ID
     * @returns {Promise<Object>}
     */
    async getGroupSettings(groupId) {
        return this.apiRequest(`/api/v1/groups/${groupId}/settings`);
    }

    /**
     * Update group settings
     * @param {string} groupId - Group ID
     * @param {Object} settings - Settings to update
     * @returns {Promise<Object>}
     */
    async updateGroupSettings(groupId, settings) {
        return this.apiRequest(`/api/v1/groups/${groupId}/settings`, {
            method: 'PUT',
            body: JSON.stringify({ settings })
        });
    }

    /**
     * Get group statistics
     * @param {string} groupId - Group ID
     * @param {string} period - Time period (day, week, month, year)
     * @returns {Promise<Object>}
     */
    async getGroupStats(groupId, period = 'week') {
        return this.apiRequest(`/api/v1/groups/${groupId}/stats?period=${period}`);
    }

    /**
     * Test spam detection
     * @param {string} text - Text to analyze
     * @param {Array} whitelistedKeywords - Optional whitelisted keywords
     * @returns {Promise<Object>}
     */
    async testSpamDetection(text, whitelistedKeywords = []) {
        return this.apiRequest('/api/v1/nlp/test/spam', {
            method: 'POST',
            body: JSON.stringify({ text, whitelistedKeywords })
        });
    }

    /**
     * Test profanity detection
     * @param {string} text - Text to analyze
     * @returns {Promise<Object>}
     */
    async testProfanityDetection(text) {
        return this.apiRequest('/api/v1/nlp/test/profanity', {
            method: 'POST',
            body: JSON.stringify({ text })
        });
    }

    /**
     * Analyze message (complete analysis)
     * @param {string} text - Text to analyze
     * @param {Array} whitelistedKeywords - Optional whitelisted keywords
     * @param {string} groupId - Optional group ID
     * @returns {Promise<Object>}
     */
    async analyzeMessage(text, whitelistedKeywords = [], groupId = null) {
        const body = { text, whitelistedKeywords };
        if (groupId) body.groupId = groupId;

        return this.apiRequest('/api/v1/nlp/analyze', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    /**
     * Get NLP service status
     * @returns {Promise<Object>}
     */
    async getNLPStatus() {
        return this.apiRequest('/api/v1/nlp/status');
    }

    /**
     * Logout user
     */
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('telegram_auth_token');
        localStorage.removeItem('telegram_user');
    }
}

// Example usage:

/*
// Initialize the auth client
const telegramAuth = new TelegramAuth('http://localhost:3000');

// Initialize login widget
telegramAuth.initializeWidget('YOUR_BOT_USERNAME', 'telegram-login-container', (result) => {
    if (result.success) {
        console.log('Logged in successfully:', result.user);
        
        // Example: Get user's groups
        telegramAuth.getUserGroups()
            .then(groups => console.log('User groups:', groups))
            .catch(error => console.error('Error:', error));
            
        // Example: Test spam detection
        telegramAuth.testSpamDetection('This is a test message')
            .then(result => console.log('Spam detection:', result))
            .catch(error => console.error('Error:', error));
    } else {
        console.error('Login failed:', result.error);
    }
});

// Check if already authenticated
if (telegramAuth.isAuthenticated()) {
    console.log('Already logged in:', telegramAuth.getCurrentUser());
}
*/

export default TelegramAuth;
