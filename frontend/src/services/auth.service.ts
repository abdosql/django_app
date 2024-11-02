export interface LoginResponse {
  access: string;
  refresh: string;
  user_id: number;
  email: string;
  is_staff: boolean;
  operator_id?: number;
  operator_priority?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

class AuthService {
  private baseUrl: string;
  private tokenCheckInterval: number | null = null;

  constructor() {
    this.baseUrl = '/api';
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const endpoint = `${this.baseUrl}/auth/token/`;
      console.log('API URL:', this.baseUrl);
      console.log('empting login to:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('Login response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Login response error:', errorText);
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.detail || 'Login failed');
        } catch (e) {
          throw new Error(`Login failed: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Login successful, storing tokens');
      sessionStorage.setItem('access_token', data.access);
      sessionStorage.setItem('refresh_token', data.refresh);
      sessionStorage.setItem('user_data', JSON.stringify({
        id: data.user_id,
        email: data.email,
        isStaff: data.is_staff,
        operatorId: data.operator_id,
        operatorPriority: data.operator_priority,
      }));
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  logout(): void {
    sessionStorage.clear();
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
    }
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem('access_token');
  }

  getUserData(): any | null {
    const userData = sessionStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  async checkAuthStatus(): Promise<boolean> {
    console.log('Checking auth status...');
    const token = this.getAccessToken();
    const refreshToken = sessionStorage.getItem('refresh_token');
    
    console.log('Tokens present:', { 
      hasAccessToken: !!token, 
      hasRefreshToken: !!refreshToken 
    });
    
    if (!token || !refreshToken) {
      console.log('Missing tokens, returning false');
      return false;
    }

    // Check if current token is valid
    if (this.isAuthenticated()) {
      console.log('Current token is valid');
      return true;
    }

    console.log('Token invalid, attempting refresh...');
    // Try to refresh the token
    try {
      const refreshResult = await this.refreshToken();
      console.log('Refresh result:', refreshResult);
      return refreshResult;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      console.log('No access token found');
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isValid = payload.exp * 1000 > Date.now();
      
      console.log('Token validation:', {
        expiresAt: new Date(payload.exp * 1000),
        isValid,
        now: new Date()
      });

      // If token is expired, return false
      if (!isValid) {
        console.log('Token is expired');
        return false;
      }

      // Also check if we have user data
      const userData = this.getUserData();
      console.log('User data present:', !!userData);
      return !!userData;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    console.log('Attempting to refresh token...');
    const refreshToken = sessionStorage.getItem('refresh_token');
    if (!refreshToken) {
      console.log('No refresh token available');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      console.log('Refresh response status:', response.status);

      if (!response.ok) {
        console.log('Refresh failed:', response.statusText);
        throw new Error('Refresh failed');
      }

      const data = await response.json();
      console.log('Refresh successful, storing new access token');
      sessionStorage.setItem('access_token', data.access);
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.logout();
      return false;
    }
  }

  startTokenCheck() {
    console.log('Starting token check interval');
    if (this.tokenCheckInterval) {
      console.log('Clearing existing interval');
      clearInterval(this.tokenCheckInterval);
    }

    // Check token every 4 minutes
    this.tokenCheckInterval = window.setInterval(async () => {
      console.log('Running periodic token check');
      const isValid = await this.checkAuthStatus();
      console.log('Token check result:', isValid);
      if (!isValid) {
        console.log('Token check failed, logging out');
        this.logout();
        window.location.href = '/login';
      }
    }, 240000);
  }

  stopTokenCheck() {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
    }
  }
}

export const authService = new AuthService();