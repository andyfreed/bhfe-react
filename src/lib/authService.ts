import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';
import { isDevelopment, isMockAuthEnabled } from './devUtils';

// Check if we're in development mode and should use mock auth
const useMockAuth = isMockAuthEnabled;

// Mock user object for development
const MOCK_USER = {
  id: 'mock-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://via.placeholder.com/150',
  },
  aud: 'authenticated',
  app_metadata: {
    provider: 'email',
    role: 'admin',
  },
};

// Define mock session for development
const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() + 3600000, // 1 hour from now
  expires_in: 3600,
  token_type: 'bearer',
  user: MOCK_USER,
};

// Mock credentials for development testing
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'password123',
};

export interface AuthError {
  message: string;
  status?: number;
}

export interface AuthResult<T = any> {
  data: T | null;
  error: AuthError | null;
}

export interface RegisterOptions {
  email: string;
  password: string;
  redirectTo?: string;
}

export interface LoginOptions {
  email: string;
  password: string;
  rememberMe?: boolean;
  redirectTo?: string;
}

/**
 * Register a new user with email and password
 */
export async function register(options: RegisterOptions): Promise<AuthResult> {
  try {
    const { email, password, redirectTo } = options;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo || `${window.location.origin}/verify`,
      },
    });
    
    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          status: error.status || 400,
        },
      };
    }
    
    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error during registration:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred',
        status: 500,
      },
    };
  }
}

/**
 * Log in a user with email and password
 */
export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    // Use mock authentication in development mode if enabled
    if (useMockAuth) {
      console.log('🔧 MOCK AUTH: Attempting login with', { email });
      
      // Simulate successful login with test credentials
      if (email === TEST_CREDENTIALS.email && password === TEST_CREDENTIALS.password) {
        console.log('🔧 MOCK AUTH: Login successful');
        
        return {
          data: {
            user: MOCK_USER,
            session: {
              access_token: 'mock-access-token',
              refresh_token: 'mock-refresh-token',
              expires_at: Date.now() + 3600000, // 1 hour from now
              user: MOCK_USER,
            },
          },
          error: null,
        };
      } else {
        console.log('🔧 MOCK AUTH: Login failed - invalid credentials');
        
        return {
          data: null,
          error: {
            message: 'Invalid login credentials',
            status: 400,
          },
        };
      }
    }
    
    // Use real Supabase authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Authentication error:', error);
      throw error;
    }

    return { data, error };
  } catch (error: any) {
    console.error('Login failed:', error);
    return {
      data: null,
      error: {
        message: error.message || 'Authentication failed',
        status: error.status || 500,
      },
    };
  }
}

/**
 * Log out the current user
 */
export async function logout(): Promise<AuthResult> {
  try {
    console.log('Starting logout process...');
    
    // First clear any browser storage to ensure complete logout
    if (typeof window !== 'undefined') {
      console.log('Clearing auth-related storage...');
      
      // Clear Supabase auth storage
      localStorage.removeItem('bhfe-auth-token');
      localStorage.removeItem('supabase.auth.token');
      
      // Find and clear all auth-related items
      const authKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('supabase.auth.') || 
        key.includes('token') || 
        key.includes('session')
      );
      
      authKeys.forEach(key => {
        console.log(`Removing storage item: ${key}`);
        localStorage.removeItem(key);
      });
      
      // Clear session storage too
      sessionStorage.clear();
    }
    
    // Use mock authentication in development mode if enabled
    if (useMockAuth) {
      console.log('🔧 MOCK AUTH: Simulating logout');
      
      // Explicitly clear all storage
      if (typeof window !== 'undefined') {
        // Clear absolutely everything in storage
        try {
          console.log('Clearing all storage...');
          localStorage.clear();
          sessionStorage.clear();
          
          // Clear any cookies related to auth
          document.cookie.split(';').forEach(function(c) {
            document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
          });
          
          // Hard reload to completely reset state
          console.log('Forcing a complete page reload...');
          window.location.href = `/login?t=${Date.now()}`;
        } catch (e) {
          console.error('Error during mock logout cleanup:', e);
          // Fallback if the above fails
          window.location.href = `/login?force=true&t=${Date.now()}`;
        }
      }
      
      return { data: true, error: null };
    }
    
    // Real logout with Supabase - using global scope to revoke all sessions
    console.log('Executing Supabase signOut with global scope...');
    const { error } = await supabase.auth.signOut({
      scope: 'global' // Revoke all sessions for this user
    });

    if (error) {
      console.error('Logout error:', error);
      throw error;
    }

    // Force a hard reload to clear any in-memory state
    console.log('Logout successful, redirecting...');
    if (typeof window !== 'undefined') {
      // Add a timestamp parameter to prevent caching
      window.location.href = `/?logout=true&t=${Date.now()}`;
    }

    return { data: true, error: null };
  } catch (error: any) {
    console.error('Logout failed:', error);
    
    // Even if the API call fails, clear local storage and redirect
    if (typeof window !== 'undefined') {
      localStorage.clear();
      window.location.href = `/login?error=${encodeURIComponent('Logout failed, but storage was cleared')}&t=${Date.now()}`;
    }
    
    return {
      data: null,
      error: {
        message: error.message || 'Logout failed',
        status: error.status || 500,
      },
    };
  }
}

/**
 * Get the current user session
 */
export async function getSession(): Promise<AuthResult> {
  try {
    // Use mock authentication in development mode if AND ONLY IF explicitly enabled
    if (useMockAuth && isDevelopment) {
      console.log('🔧 MOCK AUTH: Using mock session');
      return { 
        data: mockSession,
        error: null
      };
    }
    
    // In all other cases, use real authentication
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Get session error:', error);
      return {
        data: null,
        error: {
          message: error.message || 'Failed to get session',
          status: error.status || 400
        }
      };
    }

    return { 
      data: data.session,
      error: null 
    };
  } catch (error: any) {
    console.error('Get session failed:', error);
    return { 
      data: null, 
      error: {
        message: error.message || 'An unexpected error occurred',
        status: error.status || 500
      }
    };
  }
}

/**
 * Get the current user
 */
export async function getUser(): Promise<AuthResult> {
  try {
    // Use mock authentication in development mode if enabled via cookie
    if (isDevelopment) {
      // Check for admin token cookie 
      const cookies = document.cookie.split(';').map(cookie => cookie.trim());
      const adminTokenCookie = cookies.find(cookie => cookie.startsWith('admin_token='));
      
      if (adminTokenCookie && adminTokenCookie.split('=')[1] === 'temporary-token') {
        console.log('🔧 DEV MODE: Using admin token for authentication');
        return { 
          data: {
            ...MOCK_USER,
            email: 'a.freed@outlook.com', // Match the email used in the API
            id: '1cbb829d-e51c-493d-aa4f-c197bc759615' // Match the user ID in the database
          },
          error: null 
        };
      }
    }

    // Fall back to regular Supabase auth if no admin token
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          status: error.status || 400,
        },
      };
    }
    
    return {
      data: data.user,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error getting user:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred',
        status: 500,
      },
    };
  }
}

/**
 * Send a password reset email
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    // Use mock authentication in development mode if enabled
    if (useMockAuth) {
      console.log('🔧 MOCK AUTH: Simulating password reset for', { email });
      return { data: {}, error: null };
    }
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
      throw error;
    }

    return { data, error };
  } catch (error: any) {
    console.error('Password reset failed:', error);
    return {
      data: null,
      error: {
        message: error.message || 'Password reset failed',
        status: error.status || 500,
      },
    };
  }
} 