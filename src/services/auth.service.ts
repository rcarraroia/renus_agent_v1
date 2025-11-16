/**
 * Authentication Service
 * Handles user authentication, token management, and session persistence
 */

import { apiClient } from '../lib/api-client';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  user?: User;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

class AuthService {
  /**
   * Login user with credentials
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(
        '/api/v1/auth/login',
        credentials
      );

      // Store token
      this.setToken(response.access_token);

      // Store user if provided
      if (response.user) {
        this.setUser(response.user);
      }

      // Store expiry time if provided
      if (response.expires_in) {
        const expiryTime = Date.now() + response.expires_in * 1000;
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      }

      return response;
    } catch (error) {
      console.error('[Auth] Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout user and clear session
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    
    // Redirect to home
    window.location.href = '/';
  }

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Set JWT token
   */
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Get stored user
   */
  getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Set user data
   */
  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Check if token is expired
    if (this.isTokenExpired()) {
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryStr) return false; // No expiry set, assume valid

    const expiryTime = parseInt(expiryStr);
    return Date.now() >= expiryTime;
  }

  /**
   * Get time until token expires (in seconds)
   */
  getTimeUntilExpiry(): number | null {
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryStr) return null;

    const expiryTime = parseInt(expiryStr);
    const timeLeft = Math.max(0, expiryTime - Date.now());
    return Math.floor(timeLeft / 1000);
  }

  /**
   * Refresh token (if backend supports it)
   */
  async refreshToken(): Promise<void> {
    try {
      const response = await apiClient.post<LoginResponse>(
        '/api/v1/auth/refresh'
      );

      this.setToken(response.access_token);

      if (response.expires_in) {
        const expiryTime = Date.now() + response.expires_in * 1000;
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      }
    } catch (error) {
      console.error('[Auth] Token refresh failed:', error);
      this.logout();
      throw error;
    }
  }

  /**
   * Register new user (if backend supports it)
   */
  async register(data: {
    email: string;
    password: string;
    name?: string;
  }): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(
        '/api/v1/auth/register',
        data
      );

      // Store token
      this.setToken(response.access_token);

      // Store user if provided
      if (response.user) {
        this.setUser(response.user);
      }

      return response;
    } catch (error) {
      console.error('[Auth] Registration failed:', error);
      throw error;
    }
  }

  /**
   * Get current user profile from backend
   */
  async getCurrentUser(): Promise<User> {
    try {
      const user = await apiClient.get<User>('/api/v1/auth/me');
      this.setUser(user);
      return user;
    } catch (error) {
      console.error('[Auth] Failed to get current user:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const user = await apiClient.patch<User>('/api/v1/auth/me', data);
      this.setUser(user);
      return user;
    } catch (error) {
      console.error('[Auth] Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(data: {
    current_password: string;
    new_password: string;
  }): Promise<void> {
    try {
      await apiClient.post('/api/v1/auth/change-password', data);
    } catch (error) {
      console.error('[Auth] Failed to change password:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await apiClient.post('/api/v1/auth/forgot-password', { email });
    } catch (error) {
      console.error('[Auth] Failed to request password reset:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: {
    token: string;
    new_password: string;
  }): Promise<void> {
    try {
      await apiClient.post('/api/v1/auth/reset-password', data);
    } catch (error) {
      console.error('[Auth] Failed to reset password:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export class for testing
export default AuthService;
