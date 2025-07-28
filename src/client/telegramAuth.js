/**
 * Telegram API Authentication Helper
 * Supports both Mini Apps and external apps with Login Widget
 */

class TelegramAuth {
  constructor(apiBaseUrl = '/api/v1') {
    this.apiBaseUrl = apiBaseUrl;
    this.token = null;
  }

  /**
   * Check if running inside Telegram Mini App
   */
  isMiniApp() {
    return typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp;
  }

  /**
   * Authenticate using Telegram Mini App initData
   */
  async authenticateWithMiniApp() {
    if (!this.isMiniApp()) {
      throw new Error('Not running in Telegram Mini App context');
    }

    const tg = window.Telegram.WebApp;
    tg.ready();

    // Method 1: Use raw initData (Recommended)
    try {
      const initData = tg.initData;
      if (!initData) {
        throw new Error('No initData available from Telegram');
      }

      const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Authentication failed');
      }

      const data = await response.json();
      this.token = data.token;
      
      // Store token in sessionStorage for persistence
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('telegram_token', this.token);
      }

      return data;
    } catch (error) {
      console.error('Mini App authentication failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate using parsed Mini App data (Legacy support)
   */
  async authenticateWithParsedData() {
    if (!this.isMiniApp()) {
      throw new Error('Not running in Telegram Mini App context');
    }

    const tg = window.Telegram.WebApp;
    const initDataUnsafe = tg.initDataUnsafe;

    if (!initDataUnsafe.user) {
      throw new Error('No user data available from Telegram');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: initDataUnsafe.user.id,
          first_name: initDataUnsafe.user.first_name,
          username: initDataUnsafe.user.username,
          photo_url: initDataUnsafe.user.photo_url,
          auth_date: initDataUnsafe.auth_date,
          hash: initDataUnsafe.hash
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Authentication failed');
      }

      const data = await response.json();
      this.token = data.token;
      
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('telegram_token', this.token);
      }

      return data;
    } catch (error) {
      console.error('Parsed data authentication failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate using Login Widget data (for external apps)
   */
  async authenticateWithLoginWidget(userData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Authentication failed');
      }

      const data = await response.json();
      this.token = data.token;
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('telegram_token', this.token);
      }

      return data;
    } catch (error) {
      console.error('Login widget authentication failed:', error);
      throw error;
    }
  }

  /**
   * Auto-authenticate based on context
   */
  async authenticate() {
    // Try to get existing token
    if (typeof sessionStorage !== 'undefined') {
      const savedToken = sessionStorage.getItem('telegram_token');
      if (savedToken) {
        this.token = savedToken;
        return { token: savedToken };
      }
    }

    if (typeof localStorage !== 'undefined') {
      const savedToken = localStorage.getItem('telegram_token');
      if (savedToken) {
        this.token = savedToken;
        return { token: savedToken };
      }
    }

    // Auto-detect context and authenticate
    if (this.isMiniApp()) {
      return await this.authenticateWithMiniApp();
    } else {
      throw new Error('Please use authenticateWithLoginWidget() for external apps');
    }
  }

  /**
   * Make authenticated API requests
   */
  async apiRequest(endpoint, options = {}) {
    if (!this.token) {
      await this.authenticate();
    }

    const url = `${this.apiBaseUrl}${endpoint}`;
    const config = {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    
    if (response.status === 401) {
      // Token expired, clear it and retry authentication
      this.token = null;
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('telegram_token');
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('telegram_token');
      }
      throw new Error('Authentication expired. Please re-authenticate.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get user's groups
   */
  async getGroups() {
    return this.apiRequest('/groups');
  }

  /**
   * Get group settings
   */
  async getGroupSettings(groupId) {
    return this.apiRequest(`/groups/${groupId}/settings`);
  }

  /**
   * Update group settings
   */
  async updateGroupSettings(groupId, settings) {
    return this.apiRequest(`/groups/${groupId}/settings`, {
      method: 'PUT',
      body: JSON.stringify({ settings })
    });
  }

  /**
   * Get group statistics
   */
  async getGroupStats(groupId) {
    return this.apiRequest(`/groups/${groupId}/stats`);
  }

  /**
   * Setup Login Widget for external apps
   */
  setupLoginWidget(botUsername, containerId = 'telegram-login', options = {}) {
    if (this.isMiniApp()) {
      console.warn('Login widget not needed in Mini App context');
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }

    // Create callback function
    window.onTelegramAuth = (user) => {
      this.authenticateWithLoginWidget(user)
        .then(data => {
          if (options.onSuccess) {
            options.onSuccess(data);
          }
        })
        .catch(error => {
          if (options.onError) {
            options.onError(error);
          }
        });
    };

    // Create script element
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', options.size || 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    container.appendChild(script);
  }

  /**
   * Handle errors gracefully in Mini App context
   */
  handleError(error) {
    if (this.isMiniApp()) {
      const tg = window.Telegram.WebApp;
      
      if (error.message.includes('403')) {
        tg.showAlert('You need admin permissions for this action');
      } else if (error.message.includes('401')) {
        tg.showAlert('Please restart the app to re-authenticate');
      } else {
        tg.showAlert(`Error: ${error.message}`);
      }
    } else {
      console.error('API Error:', error);
      alert(`Error: ${error.message}`);
    }
  }
}

// Export for both ES modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TelegramAuth;
} else if (typeof window !== 'undefined') {
  window.TelegramAuth = TelegramAuth;
}

export default TelegramAuth;
