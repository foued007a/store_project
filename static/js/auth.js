// Authentication utilities for the store project

// Configuration
const API_URL = "/api";
const TOKEN_KEY = "auth_tokens";

// Store tokens in localStorage with expiration
function storeTokens(tokens) {
  const { access, refresh } = tokens;

  // Calculate expiration time (from JWT settings: 1 day for access token)
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day in milliseconds

  const tokenData = {
    access,
    refresh,
    expiresAt: expiresAt.toISOString(),
  };

  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData));
  return tokenData;
}

// Get stored tokens
function getStoredTokens() {
  const tokenString = localStorage.getItem(TOKEN_KEY);
  if (!tokenString) return null;

  const tokens = JSON.parse(tokenString);
  const now = new Date();
  const expiresAt = new Date(tokens.expiresAt);

  // Check if token is expired
  if (now > expiresAt) {
    // Token expired, try to refresh or clear
    refreshToken().catch(() => {
      clearTokens();
    });
    return null;
  }

  return tokens;
}

// Clear tokens from storage
function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
}

// Check if user is authenticated
function isAuthenticated() {
  return getStoredTokens() !== null;
}

// Get the access token for API requests
function getAccessToken() {
  const tokens = getStoredTokens();
  return tokens ? tokens.access : null;
}

// Add authorization header to fetch options
function getAuthHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// API request helper with authentication
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  // Add authorization header if available
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized - token might be expired
    if (response.status === 401) {
      // Try to refresh the token
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry the request with new token
        headers.Authorization = `Bearer ${getAccessToken()}`;
        return fetch(url, { ...config, headers });
      } else {
        // Refresh failed, clear tokens and redirect to login
        clearTokens();
        window.location.href = "/login.html";
        throw new Error("Authentication failed");
      }
    }

    return response;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

// Refresh the access token using refresh token
async function refreshToken() {
  const tokens = getStoredTokens();
  if (!tokens || !tokens.refresh) return false;

  try {
    const response = await fetch(`${API_URL}/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });

    if (!response.ok) throw new Error("Token refresh failed");

    const newTokens = await response.json();
    storeTokens({
      access: newTokens.access,
      refresh: tokens.refresh, // Keep the same refresh token
    });

    return true;
  } catch (error) {
    console.error("Token refresh failed:", error);
    clearTokens();
    return false;
  }
}

// Login function
async function login(username, password) {
  try {
    const response = await fetch(`${API_URL}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Login failed");
    }

    const tokens = await response.json();
    storeTokens(tokens);

    // Get user ID and store it
    const userResponse = await fetch(`${API_URL}/users/`, {
      headers: { Authorization: `Bearer ${tokens.access}` },
    });

    if (userResponse.ok) {
      const users = await userResponse.json();
      const currentUser = users.find((user) => user.username === username);
      if (currentUser) {
        localStorage.setItem("user_id", currentUser.id);
      }
    }

    return true;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
}

// Register function
async function register(username, password, email, phone, address) {
  try {
    const response = await fetch(`${API_URL}/clients/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, email, phone, address }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Registration failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Registration failed:", error);
    throw error;
  }
}

// Logout function
function logout() {
  clearTokens();
  window.location.href = "/static/login.html";
}

// Export the authentication utilities
window.Auth = {
  login,
  register,
  logout,
  isAuthenticated,
  getAccessToken,
  apiRequest,
};
