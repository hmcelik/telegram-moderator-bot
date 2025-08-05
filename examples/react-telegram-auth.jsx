/**
 * React Hook for Telegram Login Widget Integration
 * 
 * This provides a React hook and components for integrating with the
 * Telegram Moderator Bot API using the Login Widget.
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

// Context for authentication state
const TelegramAuthContext = createContext(null);

// Custom hook for Telegram authentication
export const useTelegramAuth = () => {
    const context = useContext(TelegramAuthContext);
    if (!context) {
        throw new Error('useTelegramAuth must be used within a TelegramAuthProvider');
    }
    return context;
};

// Authentication provider component
export const TelegramAuthProvider = ({ children, apiBaseUrl = 'http://localhost:3000' }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load stored auth data on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('telegram_auth_token');
        const storedUser = localStorage.getItem('telegram_user');
        
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
    }, []);

    // Authenticate with Login Widget data
    const authenticate = useCallback(async (userData) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${apiBaseUrl}/api/v1/auth/login-widget`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setToken(result.token);
                setUser(result.user);
                localStorage.setItem('telegram_auth_token', result.token);
                localStorage.setItem('telegram_user', JSON.stringify(result.user));
                return { success: true, token: result.token, user: result.user };
            } else {
                throw new Error(result.error?.message || 'Authentication failed');
            }
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [apiBaseUrl]);

    // Logout
    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        setError(null);
        localStorage.removeItem('telegram_auth_token');
        localStorage.removeItem('telegram_user');
    }, []);

    // Make authenticated API requests
    const apiRequest = useCallback(async (endpoint, options = {}) => {
        if (!token) {
            throw new Error('User not authenticated');
        }

        const url = `${apiBaseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
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
    }, [apiBaseUrl, token]);

    const value = {
        user,
        token,
        isLoading,
        error,
        isAuthenticated: !!(user && token),
        authenticate,
        logout,
        apiRequest
    };

    return (
        <TelegramAuthContext.Provider value={value}>
            {children}
        </TelegramAuthContext.Provider>
    );
};

// Telegram Login Widget component
export const TelegramLoginWidget = ({ 
    botUsername, 
    onAuth, 
    onError,
    size = 'large',
    requestAccess = 'write',
    className = ''
}) => {
    const { authenticate } = useTelegramAuth();
    const [widgetLoaded, setWidgetLoaded] = useState(false);

    useEffect(() => {
        // Create unique callback function name
        const callbackName = `telegramAuthCallback_${Date.now()}`;
        
        // Set global callback
        window[callbackName] = async (userData) => {
            try {
                const result = await authenticate(userData);
                if (onAuth) onAuth(result);
            } catch (error) {
                if (onError) onError(error);
            }
        };

        // Create script element
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.setAttribute('data-telegram-login', botUsername);
        script.setAttribute('data-size', size);
        script.setAttribute('data-auth-url', '#');
        script.setAttribute('data-request-access', requestAccess);
        script.setAttribute('data-onauth', `${callbackName}(user)`);

        script.onload = () => setWidgetLoaded(true);
        script.onerror = () => {
            if (onError) onError(new Error('Failed to load Telegram widget'));
        };

        // Append to container
        const container = document.getElementById('telegram-login-widget');
        if (container) {
            container.appendChild(script);
        }

        // Cleanup
        return () => {
            delete window[callbackName];
            if (container && script.parentNode) {
                container.removeChild(script);
            }
        };
    }, [botUsername, size, requestAccess, authenticate, onAuth, onError]);

    return (
        <div 
            id="telegram-login-widget" 
            className={className}
            style={{ minHeight: '40px' }}
        >
            {!widgetLoaded && <div>Loading Telegram widget...</div>}
        </div>
    );
};

// User profile component
export const UserProfile = ({ className = '' }) => {
    const { user, logout, isAuthenticated } = useTelegramAuth();

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className={`user-profile ${className}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {user.photo_url && (
                    <img 
                        src={user.photo_url} 
                        alt="User Avatar"
                        style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%' 
                        }}
                    />
                )}
                <div>
                    <div><strong>{user.first_name} {user.last_name || ''}</strong></div>
                    {user.username && <div>@{user.username}</div>}
                </div>
                <button onClick={logout} style={{ marginLeft: 'auto' }}>
                    Logout
                </button>
            </div>
        </div>
    );
};

// Groups list component
export const GroupsList = ({ className = '' }) => {
    const { apiRequest, isAuthenticated } = useTelegramAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchGroups = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await apiRequest('/api/v1/groups');
                setGroups(result.groups || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, [apiRequest, isAuthenticated]);

    if (!isAuthenticated) {
        return <div>Please log in to view your groups.</div>;
    }

    if (loading) return <div>Loading groups...</div>;
    if (error) return <div>Error loading groups: {error}</div>;

    return (
        <div className={`groups-list ${className}`}>
            <h3>Your Groups</h3>
            {groups.length === 0 ? (
                <div>No groups found.</div>
            ) : (
                <ul>
                    {groups.map(group => (
                        <li key={group.id}>
                            <strong>{group.title}</strong>
                            <div>Members: {group.member_count}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// Example usage component
export const ExampleApp = () => {
    const [authResult, setAuthResult] = useState(null);
    const [authError, setAuthError] = useState(null);

    const handleAuth = (result) => {
        setAuthResult(result);
        setAuthError(null);
        console.log('Authentication successful:', result);
    };

    const handleAuthError = (error) => {
        setAuthError(error.message);
        setAuthResult(null);
        console.error('Authentication failed:', error);
    };

    return (
        <TelegramAuthProvider apiBaseUrl="http://localhost:3000">
            <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                <h1>Telegram Moderator Bot - React Integration</h1>
                
                <UserProfile />
                
                <div style={{ margin: '20px 0' }}>
                    <h2>Login with Telegram</h2>
                    <TelegramLoginWidget
                        botUsername="YOUR_BOT_USERNAME"
                        onAuth={handleAuth}
                        onError={handleAuthError}
                    />
                    
                    {authResult && (
                        <div style={{ color: 'green', marginTop: '10px' }}>
                            ✅ Logged in successfully!
                        </div>
                    )}
                    
                    {authError && (
                        <div style={{ color: 'red', marginTop: '10px' }}>
                            ❌ Error: {authError}
                        </div>
                    )}
                </div>

                <GroupsList />
            </div>
        </TelegramAuthProvider>
    );
};

export default ExampleApp;
