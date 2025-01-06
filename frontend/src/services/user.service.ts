import { authService } from './auth.service';
import config from '../config';

class UserService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.apiUrl;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = authService.getAccessToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      const refreshed = await authService.refreshToken();
      if (refreshed) {
        // Retry with new token
        const newToken = authService.getAccessToken();
        headers['Authorization'] = `Bearer ${newToken}`;
        return fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers,
        });
      }
      throw new Error('Authentication failed');
    }

    return response;
  }

  async getUserProfile() {
    const response = await this.fetchWithAuth('/auth/users/me/');
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to fetch user profile');
    }
    return response.json();
  }

  async updateUserProfile(data: any) {
    console.log('Updating profile with data:', data);
    const response = await this.fetchWithAuth('/auth/users/me/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Update profile error:', error);
      throw new Error(error.detail || 'Failed to update user profile');
    }
    return response.json();
  }
}

export const userService = new UserService(); 